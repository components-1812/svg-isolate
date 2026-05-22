import SVGIsolate from '/src/SVGIsolate.js';

//Component definition
SVGIsolate.define(null, {
    links: [
        '/src/SVGIsolate.css',
    ]
});


const links = [
    '/0-circle.svg',
    '/2-circle.svg',
    '/3-circle.svg',
    '/4-circle.svg',
    '/5-circle.svg',
    '/6-circle.svg',
    '/7-circle.svg'
]

const svg = document.querySelector('svg-isolate');

svg.addEventListener('fetching', (e) => {

    console.log('Fetching:', e.detail);
});

/**
 * Synchronous (Code-driven)
 * 
 * Prevented using debounce with timeout 0. 
 * JS waits for the current execution stack to clear after the loop finishes.
 */
// for (const src of links) {
//     svg.src = src;
//     // svg.loadSVG(src);
// }


/**
 * Asynchronous (Network-driven)
 * 
 * Prevented using request fetch index counter (#currentFetchIndex).
 * 
 * If a newer request is started before an older request finishes fetching, 
 * the older request's index value will no longer match the current active index, 
 * and its resolved SVG will be safely discarded rather than rendered.
 */
const iterator = links.values();

const id = setInterval(() => {

    const { value, done } = iterator.next();

    if (done) {
        clearInterval(id);
        return;
    }

    console.log('Interval set src to:', value);
    svg.src = value;

}, 10);