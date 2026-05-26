

export class Debounce {

    #timeoutRef = null;
    #time;
    #callBack;
    #active = null;

    /**
     * @param {Function} callBack - Function to call after delay.
     * @param {number} [time=300] - Delay in milliseconds.
     */
    constructor(callBack, time = 300) {
        this.#callBack = callBack;
        this.#time = time;
    }

    /**
     * Runs the callback after the specified delay.
     * @param {...any} args - Arguments to pass to the callback.
     */
    run(...args) {

        this.#active ??= true;

        if (this.#active === false) return;

        if (this.#timeoutRef) clearTimeout(this.#timeoutRef);

        this.#timeoutRef = setTimeout(() => {

            this.#callBack(...args);

        }, this.#time);
    }

    /**
     * Cancels the pending callback.
     */
    cancel() {
        if (this.#timeoutRef) {
            clearTimeout(this.#timeoutRef);
        }
        this.#timeoutRef = null;
        this.#active = false;
    }

    /**
     * Resets the debounce state.
     */
    reset() {
        this.#active = null;
        this.#timeoutRef = null;
    }

    /**
     * @returns {boolean} True if debounce is active, false otherwise.
     */
    get active() {
        return this.#active;
    }
}



export class DebounceMicrotask {

    #callBack;
    #active = null;
    #flag = false;
    #value = null;
    #args = [];
    #token = null; // Unique token to validate the active microtask generation

    /**
     * @param {Function} callBack - Function to call after the microtask tick.
     */
    constructor(callBack) {
        this.#callBack = callBack;
    }

    /**
     * Runs the callback at the end of the current tick (microtask) with the latest arguments.
     * @param {...any} args - Arguments to pass to the callback.
     */
    run(...args) {

        this.#active ??= true;

        if (this.#active === false) return;

        // Trailing-edge: Always capture the latest arguments
        if (args?.length > 0) this.#args = args;

        if (this.#flag) return;

        // Generate a unique token for this specific microtask schedule
        const currentToken = Symbol('microtask');
        this.#token = currentToken;

        queueMicrotask(() => {

            // Only execute if the manager is active AND this microtask is still the valid one
            if (this.#active === true && this.#token === currentToken) {

                this.#callBack(...this.#args);
                this.#token = null;
            }

            this.#flag = false;
        });

        this.#flag = true;
    }

    /**
     * Sets a single value and runs the callback in a microtask.
     * @param {any} value - Value to pass to the callback.
     */
    set(value) {

        this.#active ??= true;

        if (this.#active === false) return;

        // Trailing-edge: Always capture the latest value
        if (value != null) this.#value = value;

        if (this.#flag) return;

        const currentToken = Symbol('microtask');

        this.#token = currentToken;

        queueMicrotask(() => {

            if (this.#active === true && this.#token === currentToken) {

                this.#callBack(this.#value);
                this.#token = null;
            }

            this.#flag = false;
        });

        this.#flag = true;
    }

    /**
     * Cancels the pending callback and immediately resets the execution flag.
     */
    cancel() {
        this.#active = false;
        this.#token = null; // Invalidates any pending microtask
        this.#flag = false;  // Allows new schedules immediately if reset/re-enabled
    }

    /**
     * Resets the debounce state, clearing pending tasks and enabling it again.
     */
    reset() {
        this.#active = null;
        this.#token = null;
        this.#flag = false;
    }

    /**
     * @returns {boolean|null} True if active, false if canceled, null if pristine/reset.
     */
    get active() {
        return this.#active;
    }
}