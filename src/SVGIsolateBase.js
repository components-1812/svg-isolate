

export class SVGIsolateBase extends HTMLElement {

    static VERSION = '0.0.2';
    static DEFAULT_TAG_NAME = 'svg-isolate';

    static LOADING = {
        LAZY: 'lazy',
        EAGER: 'eager',
        DEFER: 'defer',
        IDLE: 'idle'
    }

    static defaults = {
        loading: this.LOADING.EAGER,
        lazyThreshold: 0,
        lazyMargin: '0px',
        sanitize: false,
        useCache: true,
        responsive: false
    }

    constructor(){
        super();

        if(this.constructor.defaults.responsive) this.responsive = true;
        if(!this.constructor.defaults.useCache) this.useCache = false;
        if(this.constructor.defaults.sanitize) this.sanitize = true;
    }

    static sanitize = null;

    #observers = new Map();

    get observers(){
        return this.#observers;
    }

    //MARK: define
    /**
     * Define the custom element and add stylesheets to it if not already defined.
     * @param {string} [tagName=this.constructor.DEFAULT_TAG_NAME] - The tag name to define the custom element.
     * @param {RuleStylesSheets} [stylesSheets={}] Append styles
     * @returns {void}
     */
    static define(tagName, stylesSheets = {}){

        tagName ??= this.DEFAULT_TAG_NAME;

        if(!window.customElements.get(tagName)){

            //Append styles
            for(const key of ['links', 'adopted', 'raw']) {
                if(Array.isArray(stylesSheets[key])){
                    this.stylesSheets[key].push(...stylesSheets[key]);
                }
            }

            window.customElements.define(tagName, this);
        }
        else {
            console.warn(`Custom element with tag name "${tagName}" is already defined.`);
        }
    };

    //MARK: Styles managment
    /**
	 * @type {SVGIsolateStylesSheets} Stylesheets to be applied to the component
	 */
	static stylesSheets = { 
        links: [], 
        adopted: [], 
        raw: [] 
    }

    /**
     * Applies the given stylesheets to the component.
     * @param {SVGIsolateStylesSheets} [stylesSheets={}] 
     * - An object with stylesheets to be applied to the component. It contains three properties: `links`, `adopted`, and `raw`.
     * @fires ready-links
     */
    applyStylesSheets(stylesSheets = {}){

        //Add new styles
        for(const key of ['links', 'adopted', 'raw']) {
            if(Array.isArray(stylesSheets[key])){
                this.constructor.stylesSheets[key].push(...stylesSheets[key]);
            }
        }

        //Get styles
        const {links, adopted, raw} = this.constructor.stylesSheets;

        const $styles = document.createElement('div');
        $styles.classList.add('styles');
        $styles.style.display = 'none';

        //Links
        const linksPromises = links.map((styleSheet) => {

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet;

            const { promise, resolve, reject } = Promise.withResolvers();

            //If it's already loaded (rare in shadow DOM, but possible)
            if(link.sheet){
                resolve({ link, href: styleSheet, status: 'loaded' });
            }
            else {
                link.addEventListener('load', () => resolve({ link, href: styleSheet, status: 'loaded' }));
                link.addEventListener('error', () => reject({ link, href: styleSheet, status: 'error' }));
            }

            $styles.append(link);

            return promise;
        });

        this.removeAttribute('ready-links');

        Promise.allSettled(linksPromises).then((results) => {

            this.dispatchEvent(
                new CustomEvent('ready-links', {
                    detail: { results: results.map((r) => r.value || r.reason) },
                })
            );

            this.setAttribute('ready-links', '');
        });

        //Raw css
        raw.forEach((style) => {

            const styleElement = document.createElement('style');
            styleElement.textContent = style;

            $styles.append(styleElement);
        });

        //Clear previous styles
        this.shadowRoot.querySelector('.styles')?.remove();

        //Add new styles
        this.shadowRoot.prepend($styles);
        
        //Adopted
        this.shadowRoot.adoptedStyleSheets = adopted;
    };

    //MARK: Fetching
    static async fetchSVG(src, opt = {}){

        const { sanitize = false } = opt;

        try {
            console.log(`Fetching SVG from ${src}...`);
            const response = await fetch(src);

            if(response.ok){

                let raw = await response.text();

                if(sanitize && typeof this.sanitize === 'function') {

                    raw = this.sanitize(raw);
                }

                return raw;
            }
            else  {
                console.warn(`SVG fetch failed for "${src}": ${response.status} ${response.statusText}`);
                return null;
            }
        }
        catch(error) {

            console.warn(`SVG fetch failed for "${src}":`, error);
            return null;
        }
    }

    //MARK: Cache
    static CACHE = {
        owner: this,
        MAX_ENTRIES: 100,
        values: new Map(),
        pending: new Map(),
        set(src, value){

            if(this.MAX_ENTRIES <= 0) return;

            if(this.values.size >= this.MAX_ENTRIES){
                const first = this.values.keys().next().value;

                this.delete(first);
            }

            this.values.set(src, value);
        },
        fetchSVG(src, opt = {}){

            if(this.values.has(src)) return Promise.resolve(this.get(src));

            if(this.pending.has(src)) return this.pending.get(src);

            const promise = this.owner.fetchSVG(src, opt)
                .then(raw => {
                    if(raw) this.set(src, raw);
                    return raw;
                })
                .finally(() => this.pending.delete(src));

            this.pending.set(src, promise);

            return promise;
        },
        get(src){
            return this.values.get(src);
        },
        has(src){
            return this.values.has(src);
        },
        delete(src){
            return this.values.delete(src);
        },
        clear(){
            return this.values.clear();
        }
    }


    //MARK: loading
    get loading(){

        const {EAGER, LAZY, DEFER, IDLE} = this.constructor.LOADING;

        const value = (this.getAttribute('loading') ?? '')
            .trim().toLowerCase();

        if(value === EAGER || value === LAZY || value === DEFER || value === IDLE){
            return value;
        }

        return this.constructor.defaults.loading;
    }
    set loading(value){

        const {EAGER, LAZY, DEFER, IDLE} = this.constructor.LOADING;

        if(value == null){
            this.removeAttribute('loading');
            return;
        }

        value = String(value).trim().toLowerCase();

        if(value === EAGER || value === LAZY || value === DEFER || value === IDLE){
            
            this.setAttribute('loading', value);
        }
        else {

            console.warn(`Invalid loading value: "${value}". Valid values are: "${EAGER}", "${LAZY}", "${DEFER}", "${IDLE}".`);
        }
    }

    //MARK: src
    get src(){
        return this.getAttribute('src');
    }
    set src(value){

        if(value == null){
            this.removeAttribute('src');
            return;
        }

        value = String(value).trim();

        this.setAttribute('src', value);
    }

    //MARK: src
    get srcset(){
        return this.getAttribute('srcset');
    }
    set srcset(value){

        if(value == null){
            this.removeAttribute('srcset');
            return;
        }

        value = String(value).trim();

        this.setAttribute('srcset', value);
    }

    //MARK: sources
    get sources(){

        const base = document.baseURI;

        const result = {
            default: this.src ? new URL(this.src, base) : null,
            candidates: []
        };

        if(this.srcset){

            result.candidates = this.srcset.split(',')
            .map(candidate => {

                candidate = candidate.trim();

                try {
                    const lastSpace = candidate.lastIndexOf(' ');
                    const descriptor = lastSpace !== -1 ? candidate.slice(lastSpace + 1) : null;
    
                    let url, width;
    
                    if(descriptor?.endsWith('w')) {

                        url = candidate.slice(0, lastSpace).trim();
                        width = Number(descriptor.slice(0, -1));
                    } 
                    else {
                        // no descriptor — entire string is the URL
                        url = candidate.trim();
                        width = 0;
                    }
    
                    return { url: new URL(url, base), width };
                }
                catch(error) {
                    return null;
                }
            })
            .filter(c => c !== null);
        }

        return result;
    }

    //MARK: sanitize
    get sanitize(){
        return this.hasAttribute('sanitize');
    }
    set sanitize(value){
        this.toggleAttribute('sanitize', value != null && value !== false);
    }

    //MARK: useCache
    get useCache(){
        
        if(this.hasAttribute('no-cache')) return false;

        return this.constructor.defaults.useCache;
    }
    set useCache(value){

        if(value == null){
            this.removeAttribute('no-cache');
            return;
        }

        value = Boolean(value);

        value ? this.removeAttribute('no-cache') : this.setAttribute('no-cache', '');
    }

    //MARK: responsive
    get responsive(){
        return this.hasAttribute('responsive');
    }
    set responsive(value){
        this.toggleAttribute('responsive', value != null && value !== false);
    }

    //MARK: lazyMargin
    get lazyMargin(){
        return this.getAttribute('lazy-margin') ?? this.constructor.defaults.lazyMargin;
    }
    set lazyMargin(value){

        if(value == null){
            this.removeAttribute('lazy-margin');
            return;
        }
        value = String(value).trim();

        if(!CSS.supports('margin', value)) {
            console.warn(`Invalid lazy-margin value: "${value}". It must be a valid CSS length.`);
            return;
        }

        this.setAttribute('lazy-margin', value);
    }

    //MARK: lazyThreshold
    get lazyThreshold(){
        const defaultValue = this.constructor.defaults.lazyThreshold;
        const value = Number(this.getAttribute('lazy-threshold') ?? defaultValue);

        return Number.isNaN(value) ? defaultValue : value;
    }
    set lazyThreshold(value){

        if(value == null){
            this.removeAttribute('lazy-threshold');
            return;
        }
        value = Number(value);

        if(Number.isNaN(value)){
            console.warn(`Invalid lazy-threshold value: "${value}". It must be a number.`);
            return;
        }
        this.setAttribute('lazy-threshold', value);
    }
}

export default SVGIsolateBase;