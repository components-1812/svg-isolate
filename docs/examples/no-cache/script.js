//import SVGIsolate from '/src/SVGIsolate.js';
//import SVGIsolate from '/dist/SVGIsolate.js';

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/index.bundle.min.js';
//import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.js';
import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.js';

SVGIsolate.defaults.base = '/svg-isolate';//<- Github pages
//SVGIsolate.defaults.base = '/docs';//<- Local


class SVGIsolateDebug extends SVGIsolate {

    static fetchCounter = 0;

    //static CACHE_ENABLED = false;// Disable cache globally

    static async fetchSVG(src, opt = {}) {

        //Show fetches in the console and on the page to demonstrate caching effectiveness
        this.fetchCounter++;
        
        console.log(`[DEBUG] ${this.fetchCounter} Fetching: ${src}`);

        const p = document.createElement('p');
        p.textContent = `${this.fetchCounter} Fetching: ${src}`;

        document.querySelector('#fetch-log').appendChild(p);

        //call the base method
        return super.fetchSVG(src, opt);
    }
}

//SVGIsolateDebug.defaults.useCache = false;// Enable cache by default

SVGIsolateDebug.define(null, {
    links: [
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css'
    ]
});

window.SVGIsolate = SVGIsolateDebug;