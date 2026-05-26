import SVGIsolate from "/src/SVGIsolate.js";

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/index.bundle.min.js';
//import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/SVGIsolate.min.js';

SVGIsolate.defaults.base = '/docs';

SVGIsolate.define(null, {
    links: [
        //'/dist/SVGIsolate.css',
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/SVGIsolate.min.css'
    ]
});