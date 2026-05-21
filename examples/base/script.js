import SVGIsolate from '/src/SVGIsolate.js';
//import SVGIsolate from '/dist/SVGIsolate.js';

function LOG(url, src, base){

    console.log(`[DEBUG] Loading:`, {fetching: url, src, base});

    const div = document.createElement('div');
    div.classList.add('log');

    div.innerHTML = /*html*/`
        <p>Fetching: <a href="${url}" target="_blank">${url}</a></p>
        <p>src: <span>${src}</span> base: <span>${base}</span></p>
    `;

    document.querySelector('#fetch-log .content .logs').append(div);
}

//Show logs
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

//Component definition
SVGIsolate.define(null, {
    links: [
        '/src/SVGIsolate.css',
    ]
});

//Custom global base for load bootstrap icons
class BootstrapIconsSVG extends SVGIsolate {

    static defaults = {
        ...super.defaults,
        base: 'https://raw.githubusercontent.com/twbs/icons/refs/heads/main/icons'
    }
}

BootstrapIconsSVG.define('bootstrap-icon-svg', {
    links: [
        '/src/SVGIsolate.css',
    ]
});


window.SVGIsolate = SVGIsolate;
window.BootstrapIconsSVG = BootstrapIconsSVG;