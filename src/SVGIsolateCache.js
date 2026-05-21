
class SVGIsolateCache {

    #values = new Map();
    #pending = new Map();
    #owner;
    #size = 0;

    constructor(owner, maxEntries = 100) {
        this.#owner = owner;
        this.maxEntries = maxEntries;
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

        if (this.maxEntries <= 0) return;

        if (this.#values.size >= this.maxEntries && !this.#values.has(src)) {
            const first = this.#values.keys().next().value;
            this.delete(first);
        }

        // If replacing an existing entry, subtract its size first
        if (this.#values.has(src)) {
            const oldItem = this.#values.get(src);
            if (oldItem && oldItem.size) this.#size -= oldItem.size;
        }

        this.#values.set(src, value);
        if (value && value.size) {
            this.#size += value.size;
        }
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
            if (item && item.size) {
                this.#size -= item.size;
            }
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