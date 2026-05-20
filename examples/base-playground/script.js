
import SVGIsolate from 'https://cdn.jsdelivr.net/gh/components-1812/svg-isolate/src/SVGIsolate.js';

const examples = await (await fetch('examples.json')).json();

for (const example of examples) {

    const { src, base, desc } = example;

    const { resolved, parts } = SVGIsolate.resolveSource(src, base);
    const { srcPath, basePath, origin, search, hash } = parts;

    example.resolved = resolved.href;

    const div = document.createElement('div');
    div.classList.add('row');

    div.innerHTML = /*html*/`
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
    `;

    document.querySelector('.table').append(div);
}

console.log(examples);



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

    document.querySelector('.playground .result').replaceChildren(a);
}


const srcInput = document.querySelector('input[name="src"]');
const baseInput = document.querySelector('input[name="base"]');

console.log(srcInput)

function onChange() {
    const src = srcInput.value;
    const base = baseInput.value || '/';

    showResult(src, base);
}

srcInput.addEventListener('change', onChange);
baseInput.addEventListener('change', onChange);