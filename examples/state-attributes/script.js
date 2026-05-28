import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.js';

const svg = document.querySelector('svg-isolate');


svg.addEventListener('ready-links', (e) => {

    const {results} = e.detail;

    console.log(':ready-links', results);
});

svg.addEventListener('fetching', (e) => {

    const {resolved, src} = e.detail;

    console.log(':fetching', {resolved, src});
});

svg.addEventListener('ready', (e) => {

    console.log(':ready', e.target);
});



SVGIsolate.define(null, {
    links: [
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.css'
    ]
});