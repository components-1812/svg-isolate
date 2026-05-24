
class SVGIsolateCache {

    static parseSize(size) {
        if (size === Infinity || size === 'Infinity') return Infinity;

        if (typeof size === 'number') return size;

        if (typeof size !== 'string') return Infinity;

        const trimmed = size.trim().toLowerCase();
        const value = parseFloat(trimmed);

        if (isNaN(value)) return Infinity;

        switch (true) {

            case trimmed.endsWith('gb') || trimmed.endsWith('g'):
                return Math.round(value * 1024 * 1024 * 1024);

            case trimmed.endsWith('mb') || trimmed.endsWith('m'):
                return Math.round(value * 1024 * 1024);

            case trimmed.endsWith('kb') || trimmed.endsWith('k'):
                return Math.round(value * 1024);

            case trimmed.endsWith('b'):
                return Math.round(value);

            default:
                return Math.round(value);
        }
    }

    #values = new Map();
    #pending = new Map();
    #owner;
    #size = 0;

    constructor(owner, opt = {}) {
        const {
            maxEntries = 100,
            maxSize = Infinity
        } = opt;

        this.#owner = owner;
        this.maxEntries = maxEntries;
        this.maxSize = SVGIsolateCache.parseSize(maxSize);
    }

    get size() {
        return {
            values: this.#values.size,
            pending: this.#pending.size,
            bytes: this.#size
        };
    }
    get values() {
        return this.#values;
    }
    get pending() {
        return this.#pending;
    }
    get owner() {
        return this.#owner;
    }

    set(src, value) {

        if (this.maxEntries <= 0 || this.maxSize <= 0) return;

        const newValueSize = value?.size || 0;

        if (newValueSize > this.maxSize) {
            console.warn(`SVG cache: size of "${src}" (${newValueSize} bytes) exceeds maxSize (${this.maxSize} bytes) limit. Skipping.`);
            return;
        }

        //if exists delete for treat as clean insertion
        if (this.#values.has(src)) this.delete(src);

        //check max size
        if (this.maxSize !== Infinity) {

            while (this.#size + newValueSize > this.maxSize) {

                const first = this.#values.keys().next().value;

                if (first === undefined) break;

                this.delete(first);
            }
        }

        //check max entries
        if (this.maxEntries !== Infinity && this.#values.size >= this.maxEntries) {

            const first = this.#values.keys().next().value;

            if (first !== undefined) this.delete(first);
        }

        this.#values.set(src, value);
        this.#size += newValueSize;
    }

    fetchSVG(src, opt = {}) {

        if (this.#values.has(src)) return Promise.resolve(this.#values.get(src));

        if (this.#pending.has(src)) return this.#pending.get(src);

        const promise = this.#owner.fetchSVG(src, opt)
            .then((result) => {

                if (result.raw) {
                    this.set(src, result);
                }

                return result;
            })
            .finally(() => this.#pending.delete(src));

        this.#pending.set(src, promise);

        return promise;
    }

    get(src) {
        return this.#values.get(src);
    }

    has(src) {
        return this.#values.has(src);
    }

    delete(src) {

        if (this.#values.has(src)) {

            const item = this.#values.get(src);

            if (item?.size) this.#size -= item.size;

            return this.#values.delete(src);
        }

        return false;
    }

    clear() {
        this.#size = 0;
        return this.#values.clear();
    }
}

export default SVGIsolateCache;