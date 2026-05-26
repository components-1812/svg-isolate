import SVGIsolate from "/src/SVGIsolate.js";

import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.4.3/dist/purify.es.mjs";


class SVGIsolateDebug extends SVGIsolate {

    static sanitizer = function (raw) {

        return DOMPurify.sanitize(raw, {
            USE_PROFILES: { svg: true },
            FORBID_TAGS: ['style', 'script'],
            FORBID_ATTR: ['style'],
        });
    }

    _renderSVG(svg) {

        const pre = document.createElement('pre');
        pre.textContent = svg;

        this.closest('.row').querySelector('code').append(pre);

        return super._renderSVG(svg);
    }
}

SVGIsolateDebug.define(null, {
    links: [
        '/src/SVGIsolate.css',
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