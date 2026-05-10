# SVG Isolate Custom Element

![Id collision example](./assets/id-collision.webp)


## Examples

- **Codepen**: 
[Example 1](https://codepen.io/FrancoJavierGadea/pen/MYwNLWd)
[Example 2](https://codepen.io/FrancoJavierGadea/pen/jEPgdyR)

<br>

## Installation

#### NPM

```bash
npm install @components-1812/svg-isolate
```

- [`SVG Isolate package`](https://www.npmjs.com/package/@components-1812/svg-isolate)

#### CDN

```html
<script type="module">
    import SVGIsolate from "https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/src/SVGIsolate.min.js";

    const tagName = null;

    SVGIsolate.define(tagName, {
        links: ["https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/src/SVGIsolate.min.css"]
    });
</script>
```

- **jsdelivr**: [`SVG Isolate package`](https://www.jsdelivr.com/package/npm/@components-1812/svg-isolate)
[`SVGIsolate.js`](https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/src/SVGIsolate.min.js)
[`SVGIsolate.css`](https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/src/SVGIsolate.min.css)

- **unpkg**: [`SVG Isolate package`](https://app.unpkg.com/@components-1812/svg-isolate)
[`SVGIsolate.js`](https://unpkg.com/@components-1812/svg-isolate@0.0.2/src/SVGIsolate.js)
[`SVGIsolate.css`](https://unpkg.com/@components-1812/svg-isolate@0.0.2/src/SVGIsolate.css)

<br>

## Usage

If you use `Vite` or a framework based on `Vite` such as `Astro`, you can import the component in a **client-side** script file:

```js
import '@components-1812/svg-isolate';
```

and use it in your HTML directly:

```html
<svg-isolate>
    <svg width="200" height="200"><!-- SVG content --></svg>
</svg-isolate>

<svg-isolate src="path/to/circle.svg"></svg-isolate>
```

> **Note:**
> 
> If you are using a builder or framework that doesn't support `import ?raw`, you need to load the component and its stylesheets manually.
> 
> see [Adding CSS stylesheets manually](#adding-css-stylesheets-manually)


<br>

## Adding CSS stylesheets manually

If you want to add custom stylesheets to the component or need to load stylesheets from a different path, you can do it like this:

- Using `CSSStyleSheet` and the component’s `AdoptedStyleSheets` property:

    ```js
    import { SVGIsolate } from '@components-1812/svg-isolate/SVGIsolate.js';

    const SVGIsolateCSS = new CSSStyleSheet();
    SVGIsolateCSS.replaceSync(`
        * {
            ...raw css...
        }
    `);

    SVGIsolate.define(null, { adopted: [SVGIsolateCSS] });
    ```

<br>

- Using a `<style>` tag inside the shadow root of the component:

    ```js
    import { SVGIsolate } from '@components-1812/svg-isolate/SVGIsolate.js';

    SVGIsolate.define(null, { 
        raw: [`
            * {
                ...raw css..
            }
        `] 
    });
    ```

<br>

- Using a `<link>` tag inside the shadow root of the component:

    ```js
    import { SVGIsolate } from '@components-1812/svg-isolate/SVGIsolate.js';

    SVGIsolate.define(null, { links: ['/path/to/file.css'] });
    ```


<br>

<!--MARK: Cache -->
## Cache

By default, `<svg-isolate>` caches every SVG source **in memory** after the first fetch, so subsequent requests for the same URL are served instantly without hitting the network.

### Disabling per instance

Use the `no-cache` attribute:

```html
<svg-isolate src="path/to/file.svg" no-cache />
```

Or via the `.useCache` property:

```js
const svg = document.querySelector('svg-isolate');
svg.useCache = false;
```

### Disabling by default

To disable caching for all instances:

```js
SVGIsolate.defaults.useCache = false;
```

### Disabling cache entirely

To disable the cache system completely — no cache is created at `define()` time, `.useCache` always returns `false` and cannot be set to `true`:

```js
SVGIsolate.CACHE_ENABLED = false;
```

Must be set **before** calling `SVGIsolate.define()`.

### Max entries

By default the cache holds up to `100` entries. When the limit is reached, the oldest entry is evicted before adding the new one (FIFO):

```js
SVGIsolate.CACHE_MAX_ENTRIES = 50;
```

Also must be set before calling `SVGIsolate.define()`.

### Shared cache

The cache is shared across all instances of the same component class. Two `<svg-isolate>` elements pointing to the same `src` will only trigger one fetch — the second reuses the cached result.

### Accessing the cache directly

```js
SVGIsolate.CACHE.clear();         // clear all entries
SVGIsolate.CACHE.delete(src);     // remove a specific entry
SVGIsolate.CACHE.has(src);        // check if a src is cached
SVGIsolate.CACHE.values;          // Map with all cached entries
```

#### Preloading

You can manually populate the cache before any component renders:

```js
await SVGIsolate.CACHE.fetchSVG('/assets/icon.svg');
```

This is useful for preloading critical SVGs during app initialization so the first render is instant.

<br>

<!-- MARK: Loading -->
## Loading Strategies

`<svg-isolate>` supports four loading strategies controlled by the `loading` attribute.

### Eager (default)

Fetches the SVG immediately when the element connects to the DOM.

```html
<svg-isolate src="icon.svg" loading="eager" />
```

### Defer

Waits for the `DOMContentLoaded` event before fetching. Useful when the SVG is not critical for the initial render.

```html
<svg-isolate src="icon.svg" loading="defer" />
```

### Idle

Fetches during the browser's idle time using `requestIdleCallback`. Falls back to `defer` if the browser does not support it.

```html
<svg-isolate src="icon.svg" loading="idle" />
```

> **Note:** `requestIdleCallback` is not supported in Safari stable (May 2026). The component automatically falls back to `defer` in that case.

### Lazy

Fetches the SVG only when the element enters the viewport, using `IntersectionObserver`. Ideal for SVGs below the fold.

```html
<svg-isolate src="icon.svg" loading="lazy" />
```

You can control when the load is triggered with `lazy-margin` and `lazy-threshold`:

```html
<svg-isolate
  src="icon.svg"
  loading="lazy"
  lazy-margin="200px"
  lazy-threshold="0.5"
/>
```

- **`lazy-margin`** — extends the viewport boundary before triggering the load. Accepts any valid CSS margin value (e.g. `200px`, `10%`).
- **`lazy-threshold`** — percentage of the element that must be visible before triggering (0 to 1). Default is `0`.

### Setting a default strategy

```js
SVGIsolate.defaults.loading = 'lazy';
```

<br>

<!--MARK: Responsive -->
## srcset & Responsive

`<svg-isolate>` supports `srcset` to serve different SVG files depending on the component's rendered **width**, similar to how native `<img srcset>` works. 

### Basic usage

Each candidate requires a width descriptor (`w`) representing the intrinsic width the SVG was designed for. 

If no descriptor is provided, the candidate defaults to `0w`.


```html
<svg-isolate
  srcset="icon-300.svg 300w, icon-600.svg 600w, icon-900.svg 900w"
/>
```

### src and srcset

`src` and `srcset` are mutually exclusive. If `srcset` is present, `src` is ignored entirely — `srcset` always takes priority.

```html
<!-- only srcset is used, src is ignored -->
<svg-isolate
  src="icon.svg"
  srcset="icon-300.svg 300w, icon-600.svg 600w"
/>
```

This also applies when attributes change dynamically — if `srcset` is set at any point, `src` stops being considered until `srcset` is removed.

```js
const el = document.querySelector('svg-isolate');

el.srcset = 'icon-300.svg 300w, icon-600.svg 600w'; // src ignored from now on
el.srcset = null; // src is considered again
```

### Candidate selection algorithm

The component measures its own rendered width and picks the smallest candidate whose intrinsic width covers it:

```
component width: 450px
candidates: 300w, 600w, 900w

→ 300w < 450 — does not cover
→ 600w ≥ 450 — covers ✓ → selected
```

If the component is wider than all candidates, the **largest** is used as a fallback. 

The selection runs once on connect, and again on every resize if `responsive` is enabled.

### Responsive

By default the component resolves the candidate once on connect. Add the `responsive` attribute to keep listening for size changes and swap the SVG automatically on resize:

```html
<svg-isolate
  srcset="icon-300.svg 300w, icon-600.svg 600w, icon-900.svg 900w"
  responsive
/>
```

Swaps are debounced to avoid excessive fetches during resize. Previously loaded candidates are served from the in-memory cache instantly.

### Setting defaults

```js
SVGIsolate.defaults.responsive = true;
```

<br>

<!--MARK: Attributes -->
## Attributes

### Reactive attributes

Changes to these attributes are observed and trigger the component to update automatically.

#### `src`

Path to the SVG file to load. If not set at init time, the component looks for an inline `<svg>` in the light DOM and moves it into the shadow DOM.

```html
<!-- load from file -->
<svg-isolate src="icon.svg" />

<!-- inline SVG fallback -->
<svg-isolate>
    <svg width="200" height="200"><!-- SVG content --></svg>
</svg-isolate>
```

Changing `src` dynamically triggers a reload. Ignored if `srcset` is present.

```js
el.src = 'new-icon.svg'; // triggers reload
```

---

#### `srcset`

A comma-separated list of SVG candidates with width descriptors. Takes priority over `src`.

```html
<svg-isolate srcset="icon-300.svg 300w, icon-600.svg 600w" />
```

See [srcset & Responsive](#srcset--responsive) for full details.

---

### Behavioral attributes

These attributes control how and when the SVG is loaded. They do not trigger a reload when changed.

#### `loading`

Loading strategy. Accepted values: `eager` (default), `defer`, `idle`, `lazy`.

```html
<svg-isolate src="icon.svg" loading="lazy" />
```

#### `responsive`

Boolean attribute. When present, the component listens for resize events and swaps the SVG candidate automatically.

```html
<svg-isolate srcset="icon-300.svg 300w, icon-600.svg 600w" responsive />
```

#### `no-cache`

Boolean attribute. Disables in-memory caching for this instance.

```html
<svg-isolate src="icon.svg" no-cache />
```

#### `sanitize`

Boolean attribute. When present, the SVG is passed through the sanitizer function before rendering. Requires `SVGIsolate.sanitize` to be set.

```html
<svg-isolate src="icon.svg" sanitize />
```

#### `lazy-margin`

Extends the viewport boundary before triggering a lazy load. Accepts any valid CSS margin value. Default is `0px`.

```html
<svg-isolate src="icon.svg" loading="lazy" lazy-margin="200px" />
```

#### `lazy-threshold`

Percentage of the element that must be visible before triggering a lazy load (0 to 1). Default is `0`.

```html
<svg-isolate src="icon.svg" loading="lazy" lazy-threshold="0.5" />
```

---

### State attributes

Set by the component to reflect its current state. Read-only.

#### `ready`

Present when the SVG has been successfully rendered.

```css
svg-isolate:not([ready]) {
    opacity: 0;
}
svg-isolate[ready] {
    opacity: 1;
}
```

#### `ready-links`

Present when all external stylesheets have finished loading.


<br>

## Events

- `ready`: Dispatched when the component is ready, and the svg is loaded and rendered in the shadow DOM. shoot every time you change the `src` attribute or call `loadSVG` method.

- `ready-links`: Dispatched when the links stylesheets are loaded.

<br>

## Methods

- `async loadSVG(src)`: Load an svg from a path and replace the current svg in the shadow DOM.

<br>

## License

MIT


