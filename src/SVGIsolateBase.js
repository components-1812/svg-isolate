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

    static sanitize = null;

    #observers = new Map();

    get observers(){
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
    static define(tagName, styleSheets = {}){

        tagName ??= this.DEFAULT_TAG_NAME;

        if(!window.customElements.get(tagName)){

            //Initialize cache
            if(this.CACHE_ENABLED){
                this.CACHE = new SVGIsolateCache(this, this.CACHE_MAX_ENTRIES);
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
    static async fetchSVG(src, opt = {}){

        const { sanitize = false } = opt;

        try {

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

    //MARK: resolveSource
    static resolveSource(src, base){

        if(!src) return null;

        const Src = new URL(src, document.baseURI);
        
        // No prefix base, default base (/), or src is already an absolute URL
        if(!base  || base === '/' || URL.canParse(src)) return Src;
        
        const Base = new URL(base, document.baseURI);

        const basePath = Base.pathname.replace(/\/+$/, '');
        const srcPath = Src.pathname.replace(/^\/+/, '');

        return new URL(`${basePath}/${srcPath}${Src.search}${Src.hash}`, Base.origin);
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

    //MARK: set string attribute with validation
    #setStringAttribute(name, value, validate = () => true){

        if(value == null){
            this.removeAttribute(name);
            return;
        }
        value = String(value).trim();

        try {
            if(validate(value)) {
                this.setAttribute(name, value);
            }
        }
        catch(error) {
            console.warn(`Invalid value for attribute "${name}": "${value}".`, error);
        }
    }

    //MARK: src
    get src(){
        return this.getAttribute('src');
    }
    set src(value){
        this.#setStringAttribute('src', value);
    }

    //MARK: src
    get srcset(){
        return this.getAttribute('srcset');
    }
    set srcset(value){
        this.#setStringAttribute('srcset', value);
    }

    //MARK: sources
    get sources(){

        const result = {
            src: {
                raw: this.src,
                resolved: this.constructor.resolveSource(this.src, this.base)
            },
            srcset: []
        };

        if(this.srcset){

            result.srcset = this.srcset.split(',')
            .map(candidate => {

                candidate = candidate.trim();

                try {
                    const lastSpace = candidate.lastIndexOf(' ');
                    const descriptor = lastSpace !== -1 ? candidate.slice(lastSpace + 1) : null;
    
                    let url, width = 0;
    
                    if(descriptor?.endsWith('w')) {

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
                        resolved: this.constructor.resolveSource(url, this.base), 
                        width 
                    };
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
        return this.constructor.CACHE_ENABLED && !this.hasAttribute('no-cache');
    }
    set useCache(value){
        this.toggleAttribute('no-cache', value != null && value !== true && this.constructor.CACHE_ENABLED);
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
        this.#setStringAttribute('lazy-margin', value, (v) => {

            if(!CSS.supports('margin', value)) {
                console.warn(`Invalid lazy-margin value: "${value}". It must be a valid CSS length.`);
                return false;
            }

            return true;
        });
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

    set base(value){
        if(value == null){
            this.removeAttribute('base');
            return;
        }
        this.setAttribute('base', String(value));
    }
    get base(){
        return this.getAttribute('base') ?? this.constructor.defaults.base;
    }

    //MARK: exposeSVG
    get exposeSVG() {
        if(!this.hasAttribute('expose-svg')) return null;
        return this.getAttribute('expose-svg') || 'svg';
    }
    set exposeSVG(value) {
        if(value == null || value === false) {
            this.removeAttribute('expose-svg');
            return;
        }
        this.setAttribute('expose-svg', value === true ? '' : String(value));
    }

    get width(){
        return this.getAttribute('width');
    }
    set width(value){
        this.#setStringAttribute('width', value, (v) => {

            if(!CSS.supports('width', value)) {
                console.warn(`Invalid width value: "${value}". It must be a valid CSS length.`);
                return false;
            }
            return true;
        });
    }

    get height(){
        return this.getAttribute('height');
    }
    set height(value){
        this.#setStringAttribute('height', value, (v) => {

            if(!CSS.supports('height', value)) {
                console.warn(`Invalid height value: "${value}". It must be a valid CSS length.`);
                return false;
            }
            return true;
        });
    }

    //MARK: SVG Attributes
    get preserveAspectRatio(){
        return this.getAttribute('preserveAspectRatio');
    }
    set preserveAspectRatio(value){
        this.#setStringAttribute('preserveAspectRatio', value);
    }

    get viewBox(){
        return this.getAttribute('viewBox');
    }
    set viewBox(value){
        this.#setStringAttribute('viewBox', value);
    }
}

export default SVGIsolateBase;