import SVGIsolateBase from "./SVGIsolateBase.js";

export class SVGIsolate extends SVGIsolateBase {

    static observedAttributes = ['src', 'srcset', 'preseveAspectRatio', 'viewBox'];

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.applyStylesSheets();
    }

    connectedCallback() {

        // If an inline SVG is present, move it into the shadow DOM directly — no fetch needed
        const svg = this.querySelector('svg');

        if(svg) this.shadowRoot.append(svg);
        
        if(!this.src && !this.srcset){ 

            // No src or srcset — element is ready with no SVG
            this.dispatchEvent(new CustomEvent('ready'));
            this.setAttribute('ready', '');
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {

        if(oldValue === newValue) return;

        switch(name){
            // srcset takes priority over src — handled by ResizeObserver
            case 'srcset':
                if(this.srcset){
                    this.dispose();
                    this.#setupSrcset();
                }
                break;

            case 'src':
                if(this.src && !this.srcset){
                    this.dispose();
                    this.#loadByStrategy({src: this.src});
                }
                break;

            // These attributes don't trigger a reload, but if an SVG is already rendered, update it
            case 'preserveAspectRatio':
            case 'viewBox': {
                const svg = this.shadowRoot.querySelector('svg');
                if(svg) svg.setAttribute(name, newValue);
                break;
            }
        }
    }
    
    
    disconnectedCallback() {
        this.dispose();
    }


    //MARK: Rendering
    renderSVG(svg){

        // Raw SVG strings must be parsed into a DOM node before insertion
        if(typeof svg === 'string'){
            const parser = new DOMParser();
            svg = parser.parseFromString(svg, 'image/svg+xml').querySelector('svg');
        }

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
    async loadSVG(src){

        this.removeAttribute('ready');

        try {
            // Use in-memory cache if enabled to avoid redundant fetches
            let raw = this.useCache
                ? await this.constructor.CACHE.fetchSVG(src)
                : await this.constructor.fetchSVG(src);

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
    resolveSource(candidates = [], width){

        if(candidates.length === 0) return null;

        // Sort candidates by width ascending
        const sorted = candidates.toSorted((a, b) => a.width - b.width);

        // Pick the smallest candidate whose intrinsic width covers the current width
        const covering = sorted.filter(c => c.width >= width);
        if(covering.length) return covering[0];

        // Width exceeds all candidates — return the largest available
        return sorted.at(-1);
    }

    #setupSrcset() {

        /**
         * Shared reference to the current resolved source.
         * Passed by reference to loading strategies so that lazy loading
         * always reads the latest value at the moment the element enters the viewport.
         */
        const currentSource = {
            src: null,
        };

        const onResize = (width) => {

            const source = this.resolveSource(this.sources.candidates, width);

            if(source && source.url.href !== currentSource.src) {
                currentSource.src = source.url.href;
                this.#loadByStrategy(currentSource);
            }
        }

        let timeout;

        const observer = new ResizeObserver(entries => {
            const width = entries[0].contentRect.width;

            if(timeout) clearTimeout(timeout);
            timeout = setTimeout(() => onResize(width), 100);

            if(!this.responsive) {
                observer.disconnect();
                this.observers.delete('resize');
            }
        });

        observer.observe(this);
        this.observers.set('resize', observer);
    }

    dispose(){
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        const svg = this.shadowRoot.querySelector('svg');
        if(svg) svg.remove();

        this.removeAttribute('ready');
    }
}

export default SVGIsolate;
