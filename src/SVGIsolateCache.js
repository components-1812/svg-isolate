
class SVGIsolateCache {

    /**
     * Parses human-readable size strings (e.g., '10kb', '1.5mb', 'Infinity') into bytes.
     * @param {string|number} size - The size limit to parse.
     * @returns {number} The parsed size in bytes, or Infinity.
     */
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

    #values = new Map(); // Stores: key -> { raw, size }
    #recency = new Set(); // LRU priority queue (preserves insertion order of keys)
    #pending = new Map(); // Stores pending Promises to multiplex concurrent requests

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

    /**
     * Returns the current state and size metrics of the cache.
     * @returns {{ values: number, pending: number, bytes: number }}
     */
    get size() {
        return {
            values: this.#values.size,
            pending: this.#pending.size,
            bytes: this.#size
        };
    }
    /** @returns {Map} The internal cache Map. */
    get values() {
        return this.#values;
    }
    /** @returns {Set} The internal recency Set. */
    get recency() {
        return this.#recency;
    }
    /** @returns {Map} The internal pending Map. */
    get pending() {
        return this.#pending;
    }
    get owner() {
        return this.#owner;
    }

    /**
     * Stores an item in the cache, applying LRU eviction if limits are exceeded.
     * @param {string} src - The resource URL/key.
     * @param {{ raw: string, size: number }} value - The resource object.
     */
    set(src, value) {

        // Prevent storing if cache constraints are disabled/zeroed
        if (this.maxEntries <= 0 || this.maxSize <= 0) return;

        const newValueSize = value?.size || 0;

        // Skip if a single item exceeds the total allowed cache size
        if (newValueSize > this.maxSize) {
            console.warn(`SVG cache: size of "${src}" (${newValueSize} bytes) exceeds maxSize (${this.maxSize} bytes) limit. Skipping.`);
            return;
        }

        // Clean up previous instance of the same key to ensure a fresh insertion order
        if (this.has(src)) this.delete(src);

        // Apply maxSize constraint
        if (this.maxSize !== Infinity) {

            while (this.#size + newValueSize > this.maxSize) {

                // The first element in the Set is the oldest (Least Recently Used)
                const first = this.#recency.keys().next().value;

                if (first === undefined) break;

                this.delete(first);
            }
        }

        // Apply maxEntries constraint
        if (this.maxEntries !== Infinity && this.#recency.size >= this.maxEntries) {

            // The first element in the Set is the oldest (Least Recently Used)
            const first = this.#recency.keys().next().value;

            if (first !== undefined) this.delete(first);
        }

        // Add the new item and update state
        this.#values.set(src, value);
        this.#recency.add(src);
        this.#size += newValueSize;
    }

    async fetchSVG(src, opt = {}) {

        // Cache Hit: Immediately return value and update LRU priority
        if (this.#values.has(src)) {

            // Move src to end of Set to mark as most recently used
            this.#recency.delete(src);
            this.#recency.add(src);

            return this.#values.get(src);
        }

        // Pending Request Multiplexing: Join the existing fetch promise if already in flight
        if (this.#pending.has(src)) return this.#pending.get(src);

        // Initiate new network request
        const promise = this.#owner.fetchSVG(src, opt)
            .then((result) => {

                if (result.raw) this.set(src, result);

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
        return this.#values.has(src) && this.#recency.has(src);
    }

    /**
     * Removes an item from the cache and updates internal size counters.
     * @param {string} src - The resource URL/key to delete.
     * @returns {boolean} True if the item existed and was deleted, false otherwise.
     */
    delete(src) {

        if (this.#values.has(src)) {

            const item = this.#values.get(src);

            if (item?.size) this.#size -= item.size;

            const deletedRecency = this.#recency.delete(src);
            const deletedValues = this.#values.delete(src);

            return deletedRecency && deletedValues;
        }

        return false;
    }

    /**
     * Removes all items from the cache and resets internal state and size counters.
     */
    clear() {

        this.#size = 0;

        this.#pending.clear();
        this.#recency.clear();
        this.#values.clear();
    }
}

export default SVGIsolateCache;