import SVGIsolate from "/src/SVGIsolate.js";

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/index.bundle.min.js';
//import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.js';



document.querySelector('svg-isolate').addEventListener('ready-links', (e) => {

    const {results} = e.detail;

    console.log(':ready-links', results);
});

document.querySelector('svg-isolate').addEventListener('fetching', (e) => {

    const {resolved, src} = e.detail;

    console.log(':fetching', {resolved, src});
});

document.querySelector('svg-isolate').addEventListener('ready', (e) => {

    console.log(':ready', e.target);
});

SVGIsolate.defaults.base = '/docs';

SVGIsolate.define(null, {
    links: [
        //'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css',
        '/src/SVGIsolate.css'
    ]
});