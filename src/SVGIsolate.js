import { ComponentStyles } from "./StyleSystem.js";
import SVGIsolateBase from "./SVGIsolateBase.js";


/**
 * Loading flow:
 *
 * connectedCallback | attributeChangedCallback [src, srcset] → #loadSource
 *
 *   [srcset]  → #watchSrcset → ResizeObserver 
 *                                    └─ onResize(width) → 
 *                                            └─ ref = matchSource(this.sources.srcset, width)
 *                                            └─ #loadByStrategy(ref) → #loadSVG(src) → fetchSVG(src) [cache | network] → #renderSVG(rawSvg)
 *
 *   [src]     → #loadByStrategy(src) → #loadSVG(src) → fetchSVG(src) [cache | network] → #renderSVG(rawSvg)
 *
 *   [default] → light DOM SVG → #renderSVG(svg)
 *
 * 
 * Notes:
 *   - clear() runs at the start of #loadSource on every call except the first (connectedCallback)
 * 
 *   - src received by #loadSVG is always the raw value from the src | srcset attribute — 
 *     resolveSource(src, base) is called here to produce the final URL passed to fetchSVG
 * 
 *   - #currentSource is set in #loadSVG after a successful render — always reflects the live displayed SVG
 */

export class SVGIsolate extends SVGIsolateBase {

    static observedAttributes = ['src', 'srcset', 'preserveAspectRatio', 'viewBox', 'width', 'height'];

    static RESIZE_DEBOUNCE = 100;

    #connected = false;

    constructor() {
        super();

        const defaults = this.constructor.defaults;

        if (defaults.responsive) this.responsive = true;
        if (!defaults.useCache) this.useCache = false;
        if (defaults.sanitize) this.sanitize = true;
        if (defaults.exposeSVG) this.exposeSVG = defaults.exposeSVG;

        if (this.width) this.style.width = this.width;
        if (this.height) this.style.height = this.height;

        this.attachShadow({ mode: 'open' });

        this.componentStyles = new ComponentStyles(this, this.constructor.styleSheets);

        this.componentStyles.apply();
    }

    connectedCallback() {

        this.#loadSource();

        this.#connected = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {

        if (!this.#connected || oldValue === newValue) return;

        switch (name) {
            // srcset takes priority over src — handled by ResizeObserver
            case 'srcset':
            case 'src':
                this.#loadSource();
                break;

            // These attributes don't trigger a reload, but if an SVG is already rendered, update it
            case 'preserveAspectRatio':
            case 'viewBox':
                return this.#updateSVG(name);

            case 'width':
            case 'height':
                this[name] ? this.style[name] = this[name] : this.style.removeProperty(name);
                break;
        }
    }

    disconnectedCallback() {
        this.#connected = false;

        this.clear();
    }

    #updateSVG(name) {
        const svg = this.shadowRoot.querySelector('svg');
        const value = this[name];

        if (!svg || !value) return;

        switch (name) {
            case 'viewBox':
            case 'preserveAspectRatio':
                svg.setAttribute(name, value);
                break;
        }
    }

    //MARK: Rendering
    #renderSVG(svg) {

        // Raw SVG strings must be parsed into a DOM node before insertion
        if (typeof svg === 'string') {
            const parser = new DOMParser();
            svg = parser.parseFromString(svg, 'image/svg+xml').querySelector('svg');
        }

        if (this.exposeSVG) svg.setAttribute('part', this.exposeSVG);
        if (this.preserveAspectRatio) svg.setAttribute('preserveAspectRatio', this.preserveAspectRatio);
        if (this.viewBox) svg.setAttribute('viewBox', this.viewBox);

        const previousSVG = this.shadowRoot.querySelector('svg');

        if (previousSVG) {
            this.shadowRoot.querySelector('svg').replaceWith(svg);
        }
        else {
            this.shadowRoot.append(svg);
        }
    }

    renderSVG(svg) {
        this.clear();//Clear observers and currentSource

        //Clear all sources attributes, setting in SVGNode mode
        [
            'src', 'srcset', 'no-cache', 'responsive',
            'loading', 'lazy-margin', 'lazy-threshold', 'base'
        ]
            .forEach(attr => this.removeAttribute(attr));

        this.#renderSVG(svg);

        this.setAttribute('ready', '');
        this.dispatchEvent(new CustomEvent('ready'));
    }


    //MARK: Loading
    #currentSource = null;

    get currentSource() {
        return this.#currentSource;
    }

    async #loadSVG(src) {

        const { resolved } = this.constructor.resolveSource(src, this.base);

        this.setAttribute('fetching', '');
        this.dispatchEvent(new CustomEvent('fetching', {
            detail: { src, resolved }
        }));

        try {
            // Use in-memory cache if enabled to avoid redundant fetches
            let rawSvg = this.useCache
                ? await this.constructor.CACHE.fetchSVG(resolved.href)
                : await this.constructor.fetchSVG(resolved.href);

            if (!rawSvg) return;

            // Sanitize after fetch so the cache always stores the raw SVG
            if (this.sanitize && typeof this.constructor.sanitize === 'function') {
                rawSvg = this.constructor.sanitize(rawSvg);
            }

            this.#renderSVG(rawSvg);

            this.#currentSource = { raw: src, resolved };

            this.setAttribute('ready', '');
            this.dispatchEvent(new CustomEvent('ready'));
        }
        catch (error) {
            console.warn(`SVG load failed for "${src}":`, error);
        }
        finally {
            this.removeAttribute('fetching');
        }
    }
    loadSVG(src, opt = {}) {

        if (!src) {
            console.warn(`SVG load failed: No source provided.`)
            return;
        }

        const { base, useCache } = opt;

        if (base != null) this.base = base;
        if (useCache != null) this.useCache = useCache;

        this.src = src;
    }

    #loadSource() {

        if (this.#connected) this.clear();

        switch (true) {
            case this.srcset != null:
                this.#watchSrcset();
                break;

            case this.src != null:
                this.#loadByStrategy({ src: this.src });
                break;

            default:
                const svg = this.querySelector('svg');
                if (svg) this.shadowRoot.append(svg);

                this.dispatchEvent(new CustomEvent('ready'));
                this.setAttribute('ready', '');
        }
    }

    //MARK: Loading Strategies
    #eagerLoad(src) {
        this.#loadSVG(src);
    }
    #deferLoad(src) {

        if (document.readyState !== 'loading') this.#loadSVG(src);
        else {
            window.addEventListener('DOMContentLoaded', () => this.#loadSVG(src), { once: true });
        }
    }
    #idleLoad(src) {

        // requestIdleCallback is not fully supported in Safari stable (May 2026). Fallback to "defer".
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => this.#loadSVG(src));
        }
        else {
            console.warn(`requestIdleCallback is not supported in this browser. Use "defer" loading strategy instead.`);
            this.#deferLoad(src);
        }
    }
    /**
     * Lazy loading strategy using IntersectionObserver.
     * Receives a source reference object instead of a plain string so that
     * if the component is resized before entering the viewport, the most
     * recently resolved candidate is loaded — not the one captured at setup time.
     * @param {{ src: string }} ref - Shared source reference
     */
    #lazyLoad(ref) {

        if (this.observers.has('lazy')) return;

        const { lazyThreshold, lazyMargin } = this;

        const observer = new IntersectionObserver((entries, observer) => {

            const entry = entries[0];

            if (entry.isIntersecting) {

                this.#loadSVG(ref.src);
                observer.disconnect();
                this.observers.delete('lazy');
            }

        }, {
            root: null,
            threshold: lazyThreshold,
            rootMargin: lazyMargin
        });

        observer.observe(this);
        this.observers.set('lazy', observer);
    }
    #loadByStrategy(ref) {

        const { EAGER, DEFER, IDLE, LAZY } = this.constructor.LOADING;

        switch (this.loading) {
            case EAGER: this.#eagerLoad(ref.src);
                break;
            case DEFER: this.#deferLoad(ref.src);
                break;
            case IDLE: this.#idleLoad(ref.src);
                break;
            case LAZY: this.#lazyLoad(ref);
                break;
            default:
                console.warn(`Unknown loading strategy "${this.loading}". Falling back to "eager".`);
                this.#eagerLoad(ref.src);
        }
    }


    //MARK: Srcset and Responsive management
    /**
     * Selects the most appropriate source candidate for a given display width.
     *
     * Picks the smallest candidate whose intrinsic width covers the requested width.
     * If no candidate is large enough, returns the largest available as a fallback.
     *
     * @template {{ width: number }} T
     * @param {T[]} candidates - Parsed srcset candidates
     * @param {number} width - The current display width in pixels
     * @returns {T | null} The best matching candidate, or null if none
     */
    static matchSource(candidates = [], width) {

        if (candidates.length === 0) return null;

        // Sort candidates by width ascending
        const sorted = candidates.toSorted((a, b) => a.width - b.width);

        // Pick the smallest candidate whose intrinsic width covers the current width
        const covering = sorted.filter(c => c.width >= width);
        if (covering.length) return covering[0];

        // Width exceeds all candidates — return the largest available
        return sorted.at(-1);
    }


    #watchSrcset() {

        /**
         * Shared reference to the current resolved source.
         * Passed by reference to loading strategies so that lazy loading
         * always reads the latest value at the moment the element enters the viewport.
         */
        const ref = { src: null };

        const onResize = (width) => {

            const source = this.constructor.matchSource(this.sources.srcset, width);

            if (source && ref.src !== source.raw) {

                ref.src = source.raw;

                this.#loadByStrategy(ref);
            }

            if (!this.responsive) {
                this.observers.get('resize').disconnect();
                this.observers.delete('resize');
            }
        }

        let timeout;
        const debounceTime = this.constructor.RESIZE_DEBOUNCE ?? 100;

        const observer = new ResizeObserver(entries => {

            const width = entries[0].contentRect.width;

            if (width > 0) {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => onResize(width), debounceTime);
            }
        });

        this.observers.set('resize', observer);
        observer.observe(this);
    }


    /**
     * Disconnects all active observers, removes the rendered SVG,
     * and resets the component to its unloaded state.
     * Called internally before every new load to ensure a clean slate.
     */
    clear() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        const svg = this.shadowRoot.querySelector('svg');
        if (svg) svg.remove();

        this.#currentSource = null;
        this.removeAttribute('ready');
    }
}

export default SVGIsolate;
