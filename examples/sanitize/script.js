import SVGIsolate from "/src/SVGIsolate.js";
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
    links: ['/dist/SVGIsolate.css']
});

document.querySelector('svg-isolate[sanitize]')
.componentStyles.add({
    raw: `
        circle {
            fill: #5f000d;
        }
        rect {
            fill: #070070;
            rx: 12px;
        }
        text {
            font-size: 14px;
            fill: #c5b800;
            font-family: serif;
        }
    `
})
.apply();