import SVGIsolate from "/src/SVGIsolate.js"

import ICONS from "./icons.json" with { type: "json" };

SVGIsolate.defaults.base = 'https://raw.githubusercontent.com/twbs/icons/refs/heads/main/icons';

const Elements = [

    class extends SVGIsolate {
        static CACHE_MAX_ENTRIES = 10;
        static CACHE_MAX_SIZE = Infinity;
    },

    class extends SVGIsolate {
        static CACHE_MAX_ENTRIES = 10;
        static CACHE_MAX_SIZE = '1kb';
    },

    class extends SVGIsolate {
        static CACHE_MAX_ENTRIES = Infinity;
        static CACHE_MAX_SIZE = '10kb';
    },

    class extends SVGIsolate {
        static CACHE_MAX_ENTRIES = 50;
        static CACHE_MAX_SIZE = '1mb';
    },

];

const iconLimit = 10;

for (const [index, element] of Elements.entries()) {

    const tagName = `svg-isolate-${index}`;

    element.define(tagName, {
        links: ["/src/SVGIsolate.css"]
    });

    const div = document.createElement('div');
    div.classList.add('column');
    div.dataset.tagName = tagName;

    //Content
    const content = document.createElement('div');
    content.classList.add('content');

    const icons = ICONS.values();

    const promises = [];

    for (let i = 0; i < iconLimit; i++) {

        const icon = icons.next();

        const svg = document.createElement(tagName);
        svg.classList.add('svg-isolate');
        svg.title = icon.value;
        svg.src = icon.value;

        const { promise, resolve } = Promise.withResolvers();
        promises.push(promise)

        svg.addEventListener('ready', resolve);

        content.append(svg);
    }

    div.append(content);

    //Cache
    const cache = document.createElement('div');
    cache.classList.add('cache');
    cache.dataset.tagName = tagName;

    let { maxSize, maxEntries } = element.CACHE;

    if (maxSize === Infinity) maxSize = Number.MAX_VALUE;
    if (maxEntries === Infinity) maxEntries = Number.MAX_VALUE;

    cache.innerHTML = /*html*/`
        <h3>Cache</h3>
        <div class="info">
            <p>Max Entries: <span class="max-entries" title="${element.CACHE_MAX_ENTRIES}">${element.CACHE_MAX_ENTRIES}</span></p>
            <p>Max Size: <span class="max-size" title="${element.CACHE.maxSize.toLocaleString()} Bytes">${element.CACHE_MAX_SIZE}</span></p>
        </div>
        <ol class="items-list"></ol>
        <div class="progress">

            <div class="entries">
                <p>Items Count: <span class="current-entries">0</span></p>
                <progress class="progress-entries" max="${maxEntries}" value="0"></progress>
            </div>

            <div class="size">
                <p>Size: <span class="current-size">0 Bytes</span></p>
                <progress class="progress-size" max="${maxSize}" value="0"></progress>
            </div>
        </div>
    `;

    div.append(cache);

    //Add svg
    const button = document.createElement('button');
    button.textContent = 'Add svg';
    button.addEventListener('click', () => {

        const { value, done } = icons.next();

        if (done) return;

        const svg = document.createElement(tagName);
        svg.classList.add('svg-isolate');
        svg.title = value;
        svg.src = value;

        content.append(svg);

        svg.addEventListener('ready', () => {
            UpdateCacheInfo(tagName);

            cache.querySelector('.items-list .latest')?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        });
    });
    div.append(button);

    document.querySelector('main').append(div);


    Promise.all(promises).then(() => {
        UpdateCacheInfo(tagName);
    });
}


function UpdateCacheInfo(tagName) {

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const cache = document.querySelector(`div.cache[data-tag-name="${tagName}"]`);

    if (!cache) return;

    const SVGIsolate = customElements.get(tagName);

    const { values, bytes } = SVGIsolate.CACHE.size;

    cache.querySelector('span.current-entries').textContent = values;
    cache.querySelector('span.current-entries').title = `${values} entries`;
    cache.querySelector('.progress-entries').value = values;
    cache.querySelector('.progress-entries').title = `${values} entries`;

    cache.querySelector('span.current-size').textContent = formatBytes(bytes);
    cache.querySelector('span.current-size').title = `${bytes.toLocaleString()} Bytes`;
    cache.querySelector('.progress-size').value = bytes;
    cache.querySelector('.progress-size').title = `${bytes.toLocaleString()} Bytes`;

    const frag = document.createDocumentFragment();

    const entries = Array.from(SVGIsolate.CACHE.values.entries());

    for (let i = 0; i < entries.length; i++) {

        const [key, value] = entries[i];

        const name = key.split('/').at(-1);

        const li = document.createElement('li');
        li.innerHTML = /*html*/`
            <div class="item">
                <a class="src" data-tag-name="${tagName}" data-src="${name}" href="${key}" target="_blank">${name}</a>
                <span class="size" title="${value.size.toLocaleString()} Bytes">${formatBytes(value.size)}</span>
            </div>
        `;

        if (i === entries.length - 1) li.classList.add('latest');

        frag.append(li);
    }

    //
    Array.from(cache.closest('.column').querySelector('.content').children)
        .forEach((el) => {

            const src = el.currentSource?.resolved?.href;

            el.classList.toggle('cached', Boolean(src && SVGIsolate.CACHE.has(src)));
        });

    cache.querySelector('.items-list').replaceChildren(frag);
}


document.body.addEventListener('mouseover', ({ target }) => {

    if (target.matches('a.src')) {

        const src = target.dataset.src;
        const tagName = target.dataset.tagName;

        const column = document.querySelector(`.column[data-tag-name="${tagName}"]`);

        const element = column.querySelector(`.svg-isolate[src$="${src}"]`);

        element.classList.toggle('highlight', true);
    }
});

document.body.addEventListener('mouseout', ({ target }) => {

    if (target.matches('a.src')) {

        const src = target.dataset.src;
        const tagName = target.dataset.tagName;

        const column = document.querySelector(`.column[data-tag-name="${tagName}"]`);

        const element = column.querySelector(`.svg-isolate[src$="${src}"]`);

        element.classList.toggle('highlight', false);
    }
});