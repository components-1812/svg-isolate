

export class Debounce {

    #timeoutRef = null;
    #time;
    #callBack;
    #active = null;

    constructor(callBack, time = 300) {
        this.#callBack = callBack;
        this.#time = time;
    }

    run(...args) {

        this.#active ??= true;

        if (this.#active === false) return;

        if (this.#timeoutRef) clearTimeout(this.#timeoutRef);

        this.#timeoutRef = setTimeout(() => {

            this.#callBack(...args);

        }, this.#time);
    }

    cancel() {
        if (this.#timeoutRef) {
            clearTimeout(this.#timeoutRef);
        }
        this.#timeoutRef = null;
        this.#active = false;
    }

    reset() {
        this.#active = null;
        this.#timeoutRef = null;
    }

    get active() {
        return this.#active;
    }
}