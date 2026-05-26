import SVGIsolate from "/src/SVGIsolate.js";

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/index.bundle.min.js';
//import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/SVGIsolate.min.js';


[
    ...document.querySelectorAll('svg-isolate'),
]
    .forEach(svg => {

        svg.addEventListener('fetching', (e) => {

            const { resolved, src } = e.detail;
            const id = e.target.id;

            console.log(`Loading: ${src} to component ${id}`);
        })
    });

SVGIsolate.defaults.base = '/docs';

SVGIsolate.define(null, {
    links: [
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/SVGIsolate.min.css',
        //'/src/SVGIsolate.css'
    ]
});


//Resized width showing
const observer = new ResizeObserver((entries) => {

    for (const entry of entries) {

        const width = entry.contentRect.width - 40;

        entry.target.style.setProperty('--width', `'${width}px'`);
    }
});

document.querySelectorAll('div.resized').forEach(resized => {

    observer.observe(resized);
});