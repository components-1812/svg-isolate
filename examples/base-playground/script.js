import SVGIsolate from "/src/SVGIsolate.js";

function renderExample(example) {

    const { src, base, desc } = example;

    const { resolved, parts } = SVGIsolate.resolveSource(src, base);
    const { srcPath, basePath, origin, search, hash } = parts;

    example.resolved = resolved.href;

    const div = document.createElement('div');
    div.classList.add('row');

    div.innerHTML = /*html*/`<div class="row-content">
        <div class="desc" title="${desc}">${desc}</div>
        <div class="sources">
            <div class="src" title="${src}">
                <strong>src:</strong>
                <span>${src}</span>
            </div>
            <div class="base" title="${base}">
                <strong>base:</strong>
                <span>${base}</span>
            </div>
        </div>
        <a class="url" href="${resolved.href}" title="${resolved.href}">
            <span class="origin">${origin}</span>
            <span class="basePath">${basePath}</span>
            <span class="srcPath">${srcPath}</span>
            <span class="search">${search}</span>
            <span class="hash">${hash}</span>
        </a>
    </div>
    `;

    return div;
}

const examples = await (await fetch('examples.json')).json();

const frag = document.createDocumentFragment();

for(const example of examples) {
    frag.append(renderExample(example));
}

document.querySelector('.table').append(frag);



//Playground
function showResult(src, base = '/') {

    const { resolved, parts } = SVGIsolate.resolveSource(src, base);
    const { srcPath, basePath, origin } = parts;

    const a = document.createElement('a');
    a.classList.add('url');
    a.href = resolved.href;
    a.title = resolved.href;

    a.innerHTML = /*html*/`
        <span class="origin">${origin}</span>
        <span class="basePath">${basePath}</span>
        <span class="srcPath">${srcPath}</span>
    `;

    document.querySelector('.playground .result .result-content').replaceChildren(a);
}

const srcInput = document.querySelector('input[name="src"]');
const baseInput = document.querySelector('input[name="base"]');

function onChange() {
    const src = srcInput.value;
    const base = baseInput.value || '/';

    showResult(src, base);
}

srcInput.addEventListener('change', onChange);
baseInput.addEventListener('change', onChange);