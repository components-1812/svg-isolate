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

// for(const src of links) {
    
//     svg.src = src;
//     //svg.loadSVG(src);
// }

const iterator = links.values();

const id = setInterval(() => {

    const { value, done } = iterator.next();

    if (done) {
        clearInterval(id);
        return;
    }

    console.log(value);
    svg.src = value;

}, 10);