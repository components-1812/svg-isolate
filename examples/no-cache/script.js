//import SVGIsolate from '/src/SVGIsolate.js';
//import SVGIsolate from '/dist/SVGIsolate.js';
import '/dist/bundle.min.js';


// class SVGIsolateDebug extends SVGIsolate {

//     static fetchCounter = 0;

//     //static CACHE_ENABLED = false;// Disable cache globally

//     static async fetchSVG(src, opt = {}) {

//         //Show fetches in the console and on the page to demonstrate caching effectiveness
//         this.fetchCounter++;
        
//         console.log(`[DEBUG] ${this.fetchCounter} Fetching: ${src}`);

//         const p = document.createElement('p');
//         p.textContent = `${this.fetchCounter} Fetching: ${src}`;

//         document.querySelector('#fetch-log').appendChild(p);

//         //call the base method
//         return super.fetchSVG(src, opt);
//     }
// }

// SVGIsolateDebug.defaults.useCache = false;// Enable cache by default

// SVGIsolateDebug.define(null, {
//     links: ['/src/SVGIsolate.css']
// });