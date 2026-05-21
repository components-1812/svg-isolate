import SVGIsolate from "/src/SVGIsolate.js";

import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.4.3/dist/purify.es.mjs";


document.querySelectorAll('svg-isolate')
.forEach(element => {

    element.addEventListener('ready', (e) => {

        const svg = e.target.shadowRoot.querySelector('svg');

        const pre = document.createElement('pre');
        pre.textContent = svg.outerHTML;

        e.target.closest('.row').querySelector('code').append(pre);
    });
})

SVGIsolate.sanitize = function(raw){

    return DOMPurify.sanitize(raw, {
        USE_PROFILES: { svg: true },
        FORBID_TAGS: ['style', 'script'],
        FORBID_ATTR: ['style'],
    });
}

SVGIsolate.define(null,  {
    links: [
        '/dist/SVGIsolate.css',
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