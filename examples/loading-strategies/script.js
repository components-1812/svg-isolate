
import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.js';

SVGIsolate.defaults.base = '/svg-isolate';//gh-pages

SVGIsolate.define(null, {
    links: [
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.css'
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