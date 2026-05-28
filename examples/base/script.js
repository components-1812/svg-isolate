import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.js';

function LOG(url, src, base){

    console.log(`[DEBUG] Loading:`, {fetching: url, src, base});

    const div = document.createElement('div');
    div.classList.add('log');
    div.dataset.src = src;
    div.dataset.base = base;

    div.innerHTML = /*html*/`
        <p>Fetching: <a href="${url}" target="_blank">${url}</a></p>
        <p>src: <span>${src}</span> base: <span>${base}</span></p>
    `;

    document.querySelector('#fetch-log .content .logs').append(div);

    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

[
    ...document.querySelectorAll('svg-isolate'),
    ...document.querySelectorAll('bootstrap-icon-svg'),
]
.forEach(svg => {

    svg.addEventListener('fetching', (e) => {
        const {resolved, src} = e.detail;
        const base = e.target.base;
        
        LOG(resolved.href, src, base);
    })
});

SVGIsolate.define(null, {
    links: [
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.css',
    ]
});


//Custom global base for load bootstrap icons
class BootstrapIconsSVG extends SVGIsolate {

    static defaults = {
        ...super.defaults,
        base: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons'
    }
}

BootstrapIconsSVG.define('bootstrap-icon-svg', {
    links: [
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.css',
    ]
});


window.SVGIsolate = SVGIsolate;
window.BootstrapIconsSVG = BootstrapIconsSVG;