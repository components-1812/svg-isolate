import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.js';


SVGIsolate.defaults.base = '/svg-isolate';

SVGIsolate.define(null, {
    links: [
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.css',
    ]
});



document.querySelectorAll('.container')
    .forEach(el => {

        const svg = el.querySelector('svg-isolate');

        const div = document.createElement('div');
        div.classList.add('srcset');


        div.innerHTML = [
            '<span class="attr-name">srcset</span>="',
            svg.sources.srcset.map(({ raw, resolved, width }) => {

                return /*html*/`
                    <a class="link" href="${resolved.href}" target="_blank">${raw}</a>
                    <span class="width">${width}w</span>
                `.trim()
            })
                .join(', '),
            '"'
        ].join('');



        el.querySelector('.info').append(div);
    });