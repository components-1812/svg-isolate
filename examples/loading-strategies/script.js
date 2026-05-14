import '/dist/index.bundle.js';

const initTime = performance.now();

document.querySelectorAll('svg-isolate').forEach(svg => {

    svg.addEventListener('ready', (e) => {

        const loadTime = (performance.now() - initTime).toFixed(2);
        const loadTimeTag = loadTime < 1000 ? `${loadTime}ms` : `${(loadTime / 1000).toFixed(2)}s`;

        console.log(`Loaded: ${svg.src} at ${loadTime}ms`);


        e.target.closest('.card').style.setProperty('--load-time', `'${loadTimeTag}'`);
    });
});