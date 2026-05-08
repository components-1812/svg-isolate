


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
        sanitize: true,
        useCache: true
    }

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


    //MARK: Cache
    static CACHE = {
        values: new Map(),
        MAX_ENTRIES: 100,
        set(src, value){

            if(this.MAX_ENTRIES <= 0) return;

            if(this.values.size >= this.MAX_ENTRIES){
                const first = this.values.keys().next().value;

                this.delete(first);
            }

            this.values.set(src, value);
        },
        get(src){
            return this.values.get(src);
        },
        delete(src){
            return this.values.delete(src);
        },
        clear(){
            return this.values.clear();
        }
    }

    
    //MARK: Loading Strategies
    static strategies = {
        eager(ctx, src){

            ctx.loadSVG(src);
        },
        defer(ctx, src){

            window.addEventListener('DOMContentLoaded', () => ctx.loadSVG(src), {once: true})
        },
        idle(ctx, src){

            // requestIdleCallback is not fully supported in Safari stable (May 2026). Fallback to "defer".
            if(window.requestIdleCallback){
                window.requestIdleCallback(() => ctx.loadSVG(src));
            }
            else {
                console.warn(`requestIdleCallback is not supported in this browser. Use "defer" loading strategy instead.`);
                ctx.constructor.strategies.defer(ctx, src);
            }
        },
        lazy(ctx, src){

            if(ctx.observers.has('lazy')) return;

            const observer = new IntersectionObserver((entries, observer) => {

                const entry = entries[0];

                if(entry.isIntersecting){

                    ctx.loadSVG(src);
                    observer.disconnect();
                    ctx.observers.delete('lazy');
                }

            }, {
                root: null,
                threshold: 0
            });

            observer.observe(ctx);
            ctx.observers.set('lazy', observer);
        }
    }

    //MARK: Getters and Set

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
        return this.getAttribute('src');
    }
    set srcset(value){

        if(value == null){
            this.removeAttribute('src');
            return;
        }

        value = String(value).trim();

        this.setAttribute('src', value);
    }

    //MARK: sanitize
    get sanitize(){
        const value = (this.getAttribute('sanitize') ?? '')
            .trim().toLowerCase();

        if(this.hasAttribute('sanitize') && value !== 'none' && value !== 'off') return true;

        if(value === 'none' || value === 'off') return false;

        return this.constructor.defaults.sanitize;
    }
    set sanitize(value){

        if(value == null){
            this.removeAttribute('sanitize');
            return;
        }

        value = Boolean(value);

       this.setAttribute('sanitize', value ? '' : 'none');
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
}

export default SVGIsolateBase;