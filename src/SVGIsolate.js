
export class SVGIsolate extends HTMLElement {

    /**
     * @type {{links:string[], adopted:CSSStyleSheet[], raw:string[]}} Stylesheets to be applied to the component
     */
    static stylesSheets = {
        links: [],
        adopted: [],
        raw: []
    };

    static observedAttributes = ['src'];

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        //Styles management
        Promise.allSettled(
            SVGIsolate.stylesSheets.links.map((styleSheet) => {

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = styleSheet;

                const { promise, resolve, reject } = Promise.withResolvers();

                link.addEventListener('load', () => resolve({link, href: styleSheet, status: 'loaded'}));
                link.addEventListener('error', () => reject({link, href: styleSheet, status: 'error'}));

                this.shadowRoot.prepend(link);

                return promise;
            })
        )
        .then((results) => {

            this.dispatchEvent(new CustomEvent('ready-links', {
                detail: { results: results.map(r => r.value || r.reason) }
            }));

            this.setAttribute('ready-links', '');
        });

        SVGIsolate.stylesSheets.raw.forEach((style) => {

            const styleElement = document.createElement('style');
            styleElement.textContent = style;
            this.shadowRoot.prepend(styleElement);
        });

        this.shadowRoot.adoptedStyleSheets = SVGIsolate.stylesSheets.adopted;
    }

    connectedCallback() {
        
        if(this.hasAttribute('src')){

            this.loadSVG(this.src);
        }
        else {

            const svg = this.querySelector('svg');

            if(svg){

                this.shadowRoot.append(svg);
            }
            else {

                console.error('No SVG found in light DOM');
            }

            this.dispatchEvent(new CustomEvent('ready'));
            this.setAttribute('ready', '');
        }
    }

    disconnectedCallback() {
        
    }

    async loadSVG(src){

        this.removeAttribute('ready');
        
        try {

            const response = await fetch(src);

            const rawSVG = await response.text();

            const parser = new DOMParser();
            const SVG = parser.parseFromString(rawSVG, 'image/svg+xml').querySelector('svg');

            const previousSVG = this.shadowRoot.querySelector('svg');

            if(previousSVG){

                this.shadowRoot.querySelector('svg').replaceWith(SVG);
            }
            else {

                this.shadowRoot.append(SVG);
            }

            this.dispatchEvent(new CustomEvent('ready'));
            this.setAttribute('ready', '');
        } 
        catch (error) {

            console.error(error);
        }  
    }

    //MARK: Getters and Setters
    get src(){
        return this.getAttribute('src');
    }
    set src(value){
        value ? this.setAttribute('src', value) : this.removeAttribute('src');
    }
}

export default SVGIsolate;
