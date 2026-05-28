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

        const html = Prism.highlight(svg, Prism.languages.html, 'html');


        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.innerHTML = html;
        code.classList.add('language-html');
        pre.appendChild(code);

        this.closest('.row')?.querySelector('.code')?.append(pre);

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
        .heart {
            fill: #cf0822;
            animation: beat 2s ease-in-out infinite;
            transform-origin: center;
        }
        .rect {
            fill: #043e75ff;
        }

      
        @keyframes beat {
            0%, 100% {
                scale: 1;
            }
            50% {
                scale: 1.5;
            }
        }
    `
    })
    .apply();