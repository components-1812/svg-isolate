import SVGIsolate from '/src/SVGIsolate.js';
//import SVGIsolate from '/dist/SVGIsolate.js';

//mport 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/index.bundle.min.js';
//import SVGIsolate from 'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.js';


function LOG(url, src, base){

    console.log(`[DEBUG] Loading:`, {fetching: url, src, base});

    const div = document.createElement('div');
    div.classList.add('log');

    div.innerHTML = /*html*/`
        <p>Fetching: <a href="${url}">${url}</a></p>
        <p>src: <span>${src}</span> base: <span>${base}</span></p>
    `;

    document.querySelector('#fetch-log').append(div);
}


class SVGIsolateDebug extends SVGIsolate {

    loadSVG(src){
        super.loadSVG(src);

        const {raw, resolved} = this.currentSource;
        LOG(resolved, raw, this.base);
    }
}

SVGIsolateDebug.define(null, {
    links: [
        //'/dist/SVGIsolate.css',
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css'
    ]
});


//Custom global base for load bootstrap icons
class BootstrapIconsSVG extends SVGIsolate {

    static defaults = {
        ...super.defaults,
        base: 'https://raw.githubusercontent.com/twbs/icons/refs/heads/main/icons'
    }

    loadSVG(src){
        super.loadSVG(src);
        
        const {raw, resolved} = this.currentSource;
        LOG(resolved, raw, this.base);
    }
}

BootstrapIconsSVG.define('bootstrap-icon-svg', {
    links: [
        //'/dist/SVGIsolate.css',
        'https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2-alpha.3/dist/SVGIsolate.min.css'
    ]
});