//import SVGIsolate from "/src/SVGIsolate.js";

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/index.bundle.min.js';
import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.js';


class SVGIsolateDebug extends SVGIsolate {

    loadSVG(src){

        console.log(`Loading: ${src} to ${this.id}`);

        super.loadSVG(src);
    }
}

SVGIsolateDebug.define(null, {
    links: [
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css',
        //'/src/SVGIsolate.css'
    ]
});


//Resized width showing
const observer = new ResizeObserver((entries) => {

    for(const entry of entries) {
        
        const width = entry.contentRect.width - 40;

        entry.target.style.setProperty('--width', `'${width}px'`);
    }
});

document.querySelectorAll('div.resized').forEach(resized => {
    
    observer.observe(resized);
});