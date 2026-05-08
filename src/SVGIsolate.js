import SVGIsolateBase from "./SVGIsolateBase.js";

export class SVGIsolate extends SVGIsolateBase {

    static observedAttributes = ['src'];

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.applyStylesSheets();
    }

    connectedCallback() {

        const svg = this.querySelector('svg');

        if(svg) this.shadowRoot.append(svg);
        
        if(this.src){

            const load = this.constructor.strategies[this.loading];
            load(this, this.src);

            return;
        }

        this.dispatchEvent(new CustomEvent('ready'));
        this.setAttribute('ready', '');
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
}

export default SVGIsolate;
