//import SVGIsolate from "/src/SVGIsolate.js";

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/index.bundle.min.js';
import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.js';

import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.4.3/dist/purify.es.mjs";


class SVGIsolateDebug extends SVGIsolate {

    renderSVG(svg){
        
        const pre = document.createElement('pre');
        pre.textContent = svg;

        this.closest('.row').querySelector('code').append(pre);

        super.renderSVG(svg);
    }
}

SVGIsolateDebug.sanitize = function(raw){

    return DOMPurify.sanitize(raw, {
        USE_PROFILES: { svg: true },
        FORBID_TAGS: ['style', 'script'],
        FORBID_ATTR: ['style'],
    });
}

SVGIsolateDebug.define(null,  {
    links: [
        //'/dist/SVGIsolate.css',
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css'
    ]
});

document.querySelector('svg-isolate[sanitize]')
.componentStyles.add({
    raw: `
        circle {
            fill: #cf0822;
        }
        rect {
            fill: #3179bd;
            rx: 12px;
        }
        text {
            font-size: 14px;
            fill: #000000;
            font-family: serif;
        }
    `
})
.apply();