import { ComponentStyles } from "./StyleSystem.js";
import SVGIsolateBase from "./SVGIsolateBase.js";

export class SVGIsolate extends SVGIsolateBase {

    static observedAttributes = ['src', 'srcset', 'preserveAspectRatio', 'viewBox', 'width', 'height'];

    #connected = false;

    constructor() {
        super();

        const defaults = this.constructor.defaults;

        if(defaults.responsive) this.responsive = true;
        if(!defaults.useCache) this.useCache = false;
        if(defaults.sanitize) this.sanitize = true;
        if(defaults.exposeSVG) this.exposeSVG = defaults.exposeSVG;

        if(this.width) this.style.width = this.width;
        if(this.height) this.style.height = this.height;

        this.attachShadow({ mode: 'open' });

        this.componentStyles = new ComponentStyles(this, this.constructor.styleSheets);

        this.componentStyles.apply();
    }

    connectedCallback() {

        this.#load();

        this.#connected = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {

        if(!this.#connected || oldValue === newValue) return;

        switch(name){
            // srcset takes priority over src — handled by ResizeObserver
            case 'srcset':
            case 'src':
                this.#load();
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

        this.dispose();
    }

    #updateSVG(name){
        const svg = this.shadowRoot.querySelector('svg');
        const value = this[name];

        if(!svg || !value) return;

        switch(name){
            case 'viewBox':
            case 'preserveAspectRatio':
                svg.setAttribute(name, value);
                break;
        }
    }

    //MARK: Rendering
    renderSVG(svg){

        // Raw SVG strings must be parsed into a DOM node before insertion
        if(typeof svg === 'string'){
            const parser = new DOMParser();
            svg = parser.parseFromString(svg, 'image/svg+xml').querySelector('svg');
        }

        if(this.exposeSVG) svg.setAttribute('part', this.exposeSVG);
        if(this.preserveAspectRatio) svg.setAttribute('preserveAspectRatio', this.preserveAspectRatio);
        if(this.viewBox) svg.setAttribute('viewBox', this.viewBox);

        const previousSVG = this.shadowRoot.querySelector('svg');

        if(previousSVG){
            this.shadowRoot.querySelector('svg').replaceWith(svg);
        }
        else {
            this.shadowRoot.append(svg);
        }

        this.dispatchEvent(new CustomEvent('ready'));
        this.setAttribute('ready', '');
    }


    //MARK: Loading
    #currentSource = null;

    get currentSource(){
        return this.#currentSource;
    }

    async loadSVG(src){

        if(!src){
            console.warn(`SVG load failed: No source provided.`)
            return;
        }

        console.log(src);

        this.removeAttribute('ready');

        const resolved = this.constructor.resolveSource(src, this.base);
        this.#currentSource = { raw: src, resolved };
       
        try {
            // Use in-memory cache if enabled to avoid redundant fetches
            let raw = this.useCache
                ? await this.constructor.CACHE.fetchSVG(resolved.href)
                : await this.constructor.fetchSVG(resolved.href);

            if(!raw) return;

            // Sanitize after fetch so the cache always stores the raw SVG
            if(this.sanitize && typeof this.constructor.sanitize === 'function') {
                raw = this.constructor.sanitize(raw);
            }

            this.renderSVG(raw);
        }
        catch(error) {
            console.warn(`SVG load failed for "${src}":`, error);
        }
    }

    #load(){

        if(this.#connected) this.dispose();

        switch(true) {
            case this.srcset != null:
                this.#watchSrcset();
                break;

            case this.src != null:
                this.#loadByStrategy({src: this.src});
                break;
        
            default:
                const svg = this.querySelector('svg');
                if(svg) this.shadowRoot.append(svg);

                this.dispatchEvent(new CustomEvent('ready'));
                this.setAttribute('ready', '');
        }
    }

    //MARK: Loading Strategies
    #eagerLoad(src){
        this.loadSVG(src);
    }
    #deferLoad(src) {
        if(document.readyState !== 'loading') this.loadSVG(src);
        else {
            window.addEventListener('DOMContentLoaded', () => this.loadSVG(src), {once: true});
        } 
    }
    #idleLoad(src) {

        // requestIdleCallback is not fully supported in Safari stable (May 2026). Fallback to "defer".
        if(window.requestIdleCallback){
            window.requestIdleCallback(() => this.loadSVG(src));
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
    #lazyLoad(ref){

        if(this.observers.has('lazy')) return;

        const {lazyThreshold, lazyMargin} = this;

        const observer = new IntersectionObserver((entries, observer) => {

            const entry = entries[0];

            if(entry.isIntersecting){

                this.loadSVG(ref.src);
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
    #loadByStrategy(params){
        const {EAGER, DEFER, IDLE, LAZY} = this.constructor.LOADING;
        
        switch(this.loading){
            case EAGER: this.#eagerLoad(params.src); 
                break;
            case DEFER: this.#deferLoad(params.src); 
                break;
            case IDLE: this.#idleLoad(params.src); 
                break;
            case LAZY: this.#lazyLoad(params); 
                break;
            default: 
                console.warn(`Unknown loading strategy "${this.loading}". Falling back to "eager".`); 
                this.#eagerLoad(params.src);
        }
    }


    //MARK: Srcset and Responsive management
    static matchSource(candidates = [], width){

        if(candidates.length === 0) return null;

        // Sort candidates by width ascending
        const sorted = candidates.toSorted((a, b) => a.width - b.width);

        // Pick the smallest candidate whose intrinsic width covers the current width
        const covering = sorted.filter(c => c.width >= width);
        if(covering.length) return covering[0];

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

            if(source && ref.src !== source.raw) {

                ref.src = source.raw;

                this.#loadByStrategy(ref);
            }

            if(!this.responsive) {
                this.observers.get('resize').disconnect();
                this.observers.delete('resize');
            }
        }

        let timeout;

        const observer = new ResizeObserver(entries => {

            const width = entries[0].contentRect.width;

            if(width > 0){
                if(timeout) clearTimeout(timeout);
                timeout = setTimeout(() => onResize(width), 100);
            }
        });

        this.observers.set('resize', observer);
        observer.observe(this);
    }

    dispose(){
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        const svg = this.shadowRoot.querySelector('svg');
        if(svg) svg.remove();

        this.#currentSource = null;

        this.removeAttribute('ready');
    }
}

export default SVGIsolate;
