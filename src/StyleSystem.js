
//MARK: StyleCollection
export class StyleCollection {

    #set = new Set();
    #validator;
    #mapper;

    constructor(params = {}) {
        const {
            validator = () => true,
            mapper = (value) => value
        } = params;

        this.#validator = validator;
        this.#mapper = mapper;
    }

    add(...values){

        const items = (Array.isArray(values[0]) || values[0] instanceof Set || values[0] instanceof StyleCollection) ? values[0] : values;

        for(const value of items){

            if(this.#validator(value)) this.#set.add( this.#mapper(value) );
        }

        return this;
    }

    clear(){
        this.#set.clear();
        return this;
    }

    get size(){ 
        return this.#set.size;
    }

    has(value){ 
        return this.#set.has(value); 
    }

    toArray(){ 
        return [...this.#set]; 
    }

    [Symbol.iterator](){ 
        return this.#set.values(); 
    }
}

//MARK: ComponentStylesSheets
export class ComponentStyleSheets {

    constructor(styles = {}){

        this.adopted = new StyleCollection({
            validator: (value) => {

                return value instanceof CSSStyleSheet;
            }
        });

        this.links = new StyleCollection({
            validator: (value) => {

                return typeof value === 'string' && value.trim().length > 0 && URL.canParse(value, document.baseURI);
            },
            mapper: (value) => {

                return new URL(value, document.baseURI).href;
            }
        });

        this.raw = new StyleCollection({
            validator: (value) => {
            
                return typeof value === 'string'
            }
        });

        this.add(styles);
    }

    add(styles = {}){
        
        const {raw, links, adopted} = styles;
            
        if(links) this.links.add(links);
        if(adopted) this.adopted.add(adopted);
        if(raw) this.raw.add(raw);

        return this;
    }
    
    clear(){
        this.links.clear();
        this.adopted.clear();
        this.raw.clear();

        return this;
    }
}

//MARK: ComponentStyles
export class ComponentStyles extends ComponentStyleSheets {

    #element;

    constructor(element, styles = {}){
        super(styles);
     
        this.#element = element;
    }

    apply(){

        this.#element.removeAttribute('ready-links');

        const styles = document.createElement('div');
        styles.classList.add('styles');
        styles.style.display = 'none';

        const promises = [];

        //Render links
        for(const url of this.links) {

            const {promise, reject, resolve} = Promise.withResolvers();

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;

            //If it's already loaded (rare in shadow DOM, but possible)
            if(link.sheet){
                resolve({ link, href: url.href, status: 'loaded' });
            }
            else {
                link.addEventListener('load', () => resolve({ link, href: url, status: 'loaded' }));
                link.addEventListener('error', () => reject({ link, href: url, status: 'error' }));
            }

            styles.append(link);
            promises.push(promise);
        }

        //External css files loaded
        Promise.allSettled(promises).then((results) => {

            this.#element.dispatchEvent(
                new CustomEvent('ready-links', {
                    detail: { 
                        results: results.map((r) => r.value || r.reason) 
                    },
                })
            );

            this.#element.setAttribute('ready-links', '');
        });

        //Render raw
        for(const raw of this.raw) {

            const style = document.createElement('style');
            style.textContent = raw;

            styles.append(style);
        }

        //Clear previous styles
        this.#element.shadowRoot.querySelector('.styles')?.remove();

        //Add new styles
        this.#element.shadowRoot.prepend(styles);

        //Set Adopted Styles Sheets
        this.#element.shadowRoot.adoptedStyleSheets = this.adopted.toArray();

        return this;
    }
}


