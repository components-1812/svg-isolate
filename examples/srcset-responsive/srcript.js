import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.js';

SVGIsolate.defaults.base = '/svg-isolate';

SVGIsolate.define(null, {
    links: [
        'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate@main/src/SVGIsolate.css'
    ]
});


// LOG ------------------------------------------------------------------------------
function LOG(url, src, id) {

    console.log(`[DEBUG] Loading:`, { fetching: url, src, id });

    const div = document.createElement('div');
    div.classList.add('log');

    div.innerHTML = /*html*/`
        <p class="component">Component: <span class="target" data-id="${id}">&lt;svg-isolate id="${id}"&gt;</span></p>
        <p>Fetching: <a href="${url}" target="_blank">${src}</a></p>
    `;

    document.querySelector('#fetch-log .content .logs').append(div);
}

const resized = document.querySelector('div.resized');

//Resized width showing
const observer = new ResizeObserver((entries) => {

    for (const entry of entries) {

        const width = entry.contentRect.width

        entry.target.style.setProperty('--width', `'${width}px'`);
    }
});

document.body.addEventListener('mouseover', ({ target }) => {

    if (target.matches('span.target')) {

        const id = target.dataset.id;

        const element = document.querySelector(`svg-isolate[id="${id}"]`);

        element.classList.toggle('highlight', true);
    }
});

document.body.addEventListener('mouseout', ({ target }) => {

    if (target.matches('span.target')) {

        const id = target.dataset.id;

        const element = document.querySelector(`svg-isolate[id="${id}"]`);

        element.classList.toggle('highlight', false);
    }
});


// Create elements -------------------------------------------------------------------------------
const sources = [
    '/assets/ovni.svg 100w',
    '/assets/star.svg 200w',
    '/assets/circle.svg 300w',
    '/assets/ring.svg 400w',
    '/assets/triangle.svg 600w',
    '/assets/text.svg 800w',
    '/assets/heart.svg 1000w',
    '/assets/hexagon.svg 1200w'
];

const $svg1 = document.createElement('svg-isolate');
$svg1.id = '1';
$svg1.responsive = true;
$svg1.srcset = sources.join(', ');

const $svg2 = document.createElement('svg-isolate');
$svg2.id = '2';
$svg2.responsive = true;
$svg2.loading = 'lazy';
$svg2.srcset = sources.join(', ');


[$svg1, $svg2].forEach(svg => {

    svg.addEventListener('fetching', (e) => {

        const { resolved, src } = e.detail;
        const id = e.target.id;

        LOG(resolved.href, src, id);
    })

    observer.observe(svg);
});

document.querySelector('.resized .main').append($svg1);
document.querySelector('.resized .scrolled').append($svg2);


//Show Sources

$svg1.sources.srcset.forEach(({ raw, resolved, width }) => {

    const li = document.createElement('li');
    li.innerHTML = /*html*/`
        <p>
            <a href="${resolved.href}" target="_blank">${raw}</a>
            <span>${width}w</span>
        </p>
    `;

    document.querySelector('.sources ul').append(li);
});





