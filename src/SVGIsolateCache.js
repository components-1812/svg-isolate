
class SVGIsolateCache {

    #values = new Map();
    #pending = new Map();
    #owner;

    constructor(owner, maxEntries = 100){
        this.#owner = owner;
        this.maxEntries = maxEntries;
    }

    get values(){
        return this.#values;
    }
    get pending(){
        return this.#pending;
    }
    get owner(){
        return this.#owner;
    }

    set(src, value){

        if(this.maxEntries <= 0) return;

        if(this.#values.size >= this.maxEntries){
            const first = this.#values.keys().next().value;

            this.delete(first);
        }

        this.#values.set(src, value);
    }

    fetchSVG(src, opt = {}){

        if(this.#values.has(src)) return Promise.resolve(this.#values.get(src));

        if(this.#pending.has(src)) return this.#pending.get(src);

        const promise = this.#owner.fetchSVG(src, opt)
            .then(raw => {
                if(raw) this.#values.set(src, raw);
                return raw;
            })
            .finally(() => this.#pending.delete(src));

        this.#pending.set(src, promise);

        return promise;
    }

    get(src){
        return this.#values.get(src);
    }

    has(src){
        return this.#values.has(src);
    }

    delete(src){
        return this.#values.delete(src);
    }

    clear(){
        return this.#values.clear();
    }
}

export default SVGIsolateCache;