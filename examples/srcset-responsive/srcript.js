// import '/dist/index.bundle.js';

import { SVGIsolate } from '/src/SVGIsolate.js';

SVGIsolate.define(null, {
    links: ['/src/SVGIsolate.css']
});


const observer = new ResizeObserver((entries) => {

    for(const entry of entries) {
        
        const width = entry.contentRect.width;

        entry.target.style.setProperty('--width', `'${width}px'`);
    }
});

document.querySelectorAll('div.resized').forEach(resized => {
    
    observer.observe(resized);
});