import { ComponentStyleSheets } from "./StyleSystem.js";
import SVGIsolateCache from "./SVGIsolateCache.js";

export class SVGIsolateBase extends HTMLElement {

    static VERSION = '0.0.2';
    static DEFAULT_TAG_NAME = 'svg-isolate';

    static LOADING = {
        LAZY: 'lazy',
        EAGER: 'eager',
        DEFER: 'defer',
        IDLE: 'idle'
    }

    static CACHE_ENABLED = true;
    static CACHE_MAX_ENTRIES = 100;
    static CACHE_MAX_SIZE = Infinity;

    static RESIZE_DEBOUNCE = 100;

    static defaults = {
        loading: this.LOADING.EAGER,
        lazyThreshold: 0,
        lazyMargin: '0px',
        sanitize: false,
        useCache: true,
        responsive: false,
        exposeSVG: false,
        base: '/'
    }

    static sanitizer = null;

    #observers = new Map();

    get observers() {
        return this.#observers;
    }

    /**
     * @type {ComponentStyleSheets} Stylesheets to be applied to the component
     */
    static styleSheets = null;

    //MARK: define
    /**
     * Define the custom element and add stylesheets to it if not already defined.
     * @param {string} [tagName=this.constructor.DEFAULT_TAG_NAME] - The tag name to define the custom element.
     * @param {ComponentStyleSheets} [styleSheets={}] Append styles
     * @returns {void}
     */
    static define(tagName, styleSheets = {}) {

        tagName ??= this.DEFAULT_TAG_NAME;

        if (!window.customElements.get(tagName)) {

            //Initialize cache
            if (this.CACHE_ENABLED) {
                this.CACHE = new SVGIsolateCache(this, {
                    maxEntries: this.CACHE_MAX_ENTRIES,
                    maxSize: this.CACHE_MAX_SIZE
                });
            }

            //Append styles
            this.styleSheets = new ComponentStyleSheets(styleSheets);

            window.customElements.define(tagName, this);
        }
        else {
            console.warn(`Custom element with tag name "${tagName}" is already defined.`);
        }
    };


    //MARK: Fetching
    static async fetchSVG(src, opt = {}) {

        const { sanitize = false } = opt;

        try {

            const response = await fetch(src);

            const contentLength = Number(response.headers.get('Content-Length'));

            if (response.ok) {

                let raw = await response.text();

                if (sanitize && typeof this.sanitizer === 'function') {

                    raw = this.sanitizer(raw);
                }

                const size = Number.isNaN(contentLength) ? 0 : contentLength;

                return { raw, size };
            }
            else {
                console.warn(`SVG fetch failed for "${src}": ${response.status} ${response.statusText}`);
                return null;
            }
        }
        catch (error) {

            console.warn(`SVG fetch failed for "${src}":`, error);
            return null;
        }
    }

    //MARK: resolveSource
    static resolveSource(src, base) {

        if (src == null) return null;

        const Src = new URL(src, document.baseURI);

        // No prefix base, default base (/), or src is already an absolute URL
        if (!base || base === '/' || URL.canParse(src)) return {
            resolved: Src,
            parts: {
                origin: Src.origin,
                basePath: '',
                srcPath: Src.pathname,
                search: Src.search,
                hash: Src.hash
            }
        };

        const Base = new URL(base, document.baseURI);

        const basePath = Base.pathname.replace(/\/+$/, '');
        const srcPath = Src.pathname.replace(/^\/+/, '');

        return {
            resolved: new URL(`${basePath}/${srcPath}${Src.search}${Src.hash}`, Base.origin),
            parts: {
                origin: Base.origin,
                basePath: basePath,
                srcPath: '/' + srcPath,
                search: Src.search,
                hash: Src.hash
            }
        };
    }

    //MARK: sources
    get sources() {

        const result = {
            src: null,
            srcset: []
        };

        if (this.src) {
            try {
                result.src = {
                    raw: this.src,
                    resolved: this.constructor.resolveSource(this.src, this.base).resolved
                };
            }
            catch (error) {
                // If resolving src fails (e.g. malformed URL), leave result.src as null
            }
        }
        if (this.srcset) {

            result.srcset = this.srcset.split(',')
                .map(candidate => {

                    candidate = candidate.trim();

                    try {
                        const lastSpace = candidate.lastIndexOf(' ');
                        const descriptor = lastSpace !== -1 ? candidate.slice(lastSpace + 1) : null;

                        let url, width = 0;

                        if (descriptor?.endsWith('w')) {

                            url = candidate.slice(0, lastSpace).trim();
                            width = Number(descriptor.slice(0, -1));
                        }
                        else {
                            // no descriptor — entire string is the URL
                            url = candidate.trim();
                            width;
                        }

                        return {
                            raw: url,
                            resolved: this.constructor.resolveSource(url, this.base).resolved,
                            width
                        };
                    }
                    catch (error) {
                        return null;
                    }
                })
                .filter(c => c !== null);
        }

        return result;
    }

    //MARK: Attributes management
    //MARK: set string attribute with validation
    _setStringAttribute(name, value, opt = {}) {

        if (value == null) {
            this.removeAttribute(name);
            return;
        }

        const {
            validate = () => true,
            message = `Invalid value for attribute "${name}": "${value}".`
        } = opt;

        value = String(value).trim();

        try {
            if (validate(value)) this.setAttribute(name, value);

        }
        catch (error) {
            console.warn(message, error);
        }
    }
    //MARK: set number attribute with validation
    _setNumberAttribute(name, value, opt = {}) {

        if (value == null) {
            this.removeAttribute(name);
            return;
        }

        const {
            validate = () => true,
            message = `Invalid value for attribute "${name}": "${value}". It must be a number.`
        } = opt;

        const number = Number(value);

        if (Number.isNaN(number)) {
            console.warn(message);
            return;
        }

        try {
            if (validate(number)) this.setAttribute(name, number);
        }
        catch (error) {
            console.warn(message, error);
        }
    }

    //MARK: loading
    get loading() {

        const { EAGER, LAZY, DEFER, IDLE } = this.constructor.LOADING;

        const value = (this.getAttribute('loading') ?? '')
            .trim().toLowerCase();

        if (value === EAGER || value === LAZY || value === DEFER || value === IDLE) {
            return value;
        }

        return this.constructor.defaults.loading;
    }
    set loading(value) {

        const { EAGER, LAZY, DEFER, IDLE } = this.constructor.LOADING;

        this._setStringAttribute('loading', value, {
            validate: (v) => {

                return v === EAGER || v === LAZY || v === DEFER || v === IDLE;
            },
            message: `Invalid loading value: "${value}". Valid values are: "${EAGER}", "${LAZY}", "${DEFER}", "${IDLE}".`
        });
    }


    //MARK: src
    get src() {
        return this.getAttribute('src');
    }
    set src(value) {
        this._setStringAttribute('src', value);
    }

    //MARK: src
    get srcset() {
        return this.getAttribute('srcset');
    }
    set srcset(value) {
        this._setStringAttribute('srcset', value);
    }

    //MARK: sanitize
    get sanitize() {
        return this.hasAttribute('sanitize');
    }
    set sanitize(value) {
        this.toggleAttribute('sanitize', value != null && value !== false);
    }

    //MARK: useCache
    get useCache() {
        return this.constructor.CACHE_ENABLED && !this.hasAttribute('no-cache');
    }
    set useCache(value) {
        this.toggleAttribute('no-cache', value != null && value !== true && this.constructor.CACHE_ENABLED);
    }

    //MARK: responsive
    get responsive() {
        return this.hasAttribute('responsive');
    }
    set responsive(value) {
        this.toggleAttribute('responsive', value != null && value !== false);
    }

    //MARK: lazyMargin
    get lazyMargin() {
        return this.getAttribute('lazy-margin') ?? this.constructor.defaults.lazyMargin;
    }
    set lazyMargin(value) {
        this._setStringAttribute('lazy-margin', value, {
            validate: (v) => {

                if (!CSS.supports('margin', v)) {
                    console.warn(`Invalid lazy-margin value: "${value}". It must be a valid CSS length.`);
                    return false;
                }

                return true;
            },
            message: `Invalid lazy-margin value: "${value}". It must be a valid CSS length.`
        });
    }

    //MARK: lazyThreshold
    get lazyThreshold() {
        const defaultValue = this.constructor.defaults.lazyThreshold;
        const value = Number(this.getAttribute('lazy-threshold') ?? defaultValue);

        return Number.isNaN(value) ? defaultValue : value;
    }
    set lazyThreshold(value) {
        this._setNumberAttribute('lazy-threshold', value, {
            validate: (n) => n >= 0 && n <= 1,
            message: `Invalid lazy-threshold value: "${value}". It must be a number between 0 and 1.`
        });
    }

    //MARK: base
    get base() {
        return this.getAttribute('base') ?? this.constructor.defaults.base;
    }
    set base(value) {
        this._setStringAttribute('base', value);
    }

    //MARK: exposeSVG
    get exposeSVG() {
        if (!this.hasAttribute('expose-svg')) return null;
        return this.getAttribute('expose-svg') || 'svg';
    }
    set exposeSVG(value) {
        if (value == null || value === false) {
            this.removeAttribute('expose-svg');
            return;
        }
        this.setAttribute('expose-svg', value === true ? '' : String(value));
    }

    get width() {
        return this.getAttribute('width');
    }
    set width(value) {
        this._setStringAttribute('width', value, {
            validate: (v) => {

                if (!CSS.supports('width', v)) {
                    console.warn(`Invalid width value: "${v}". It must be a valid CSS length.`);
                    return false;
                }

                return true;
            },
            message: `Invalid width value: "${value}". It must be a valid CSS length.`
        });
    }

    get height() {
        return this.getAttribute('height');
    }
    set height(value) {
        this._setStringAttribute('height', value, {
            validate: (v) => {

                if (!CSS.supports('height', v)) {
                    console.warn(`Invalid height value: "${v}". It must be a valid CSS length.`);
                    return false;
                }

                return true;
            },
            message: `Invalid height value: "${value}". It must be a valid CSS length.`
        });
    }

    //MARK: SVG Attributes
    get preserveAspectRatio() {
        return this.getAttribute('preserveAspectRatio');
    }
    set preserveAspectRatio(value) {
        this._setStringAttribute('preserveAspectRatio', value);
    }

    get viewBox() {
        return this.getAttribute('viewBox');
    }
    set viewBox(value) {
        this._setStringAttribute('viewBox', value);
    }
}

export default SVGIsolateBase;