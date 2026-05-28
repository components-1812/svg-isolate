<<<<<<< HEAD
import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.js';
=======
import SVGIsolate from '/src/SVGIsolate.js';
>>>>>>> main


SVGIsolate.defaults.base = '/svg-isolate';//gh-pages

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
<<<<<<< HEAD
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.css'
=======
        '/src/SVGIsolate.css'
>>>>>>> main
    ]
});