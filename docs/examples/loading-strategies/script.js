//import '/dist/index.bundle.js';
//import SVGIsolate from "/src/SVGIsolate.js";

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/index.bundle.min.js';
import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.js';

SVGIsolate.define(null, {
    links: [
        //'/dist/SVGIsolate.css',
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css'
    ]
});


const initTime = performance.now();

document.querySelectorAll('svg-isolate').forEach(svg => {

    svg.addEventListener('ready', (e) => {

        const loadTime = (performance.now() - initTime).toFixed(2);
        const loadTimeTxt = loadTime < 1000 ? `${loadTime}ms` : `${(loadTime / 1000).toFixed(2)}s`;

        console.log(`Loaded: ${svg.src} at ${loadTimeTxt}`);

        e.target.closest('.card').style.setProperty('--load-time', `'${loadTimeTxt}'`);
    });
});