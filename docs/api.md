
# SVGIsolate

A web component that loads, caches, and renders SVG files in an isolated shadow DOM. Supports multiple loading strategies, srcset-based responsive images, in-memory caching, and optional sanitization.

---

## Static Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `VERSION` | `string` | `'0.0.2'` | Current version of the component |
| `DEFAULT_TAG_NAME` | `string` | `'svg-isolate'` | Default tag name used when calling `define()` |
| `CACHE_ENABLED` | `boolean` | `true` | Enables or disables the cache system entirely. Must be set before `define()` |
| `CACHE_MAX_ENTRIES` | `number` | `100` | Maximum number of entries the cache holds. Must be set before `define()` |
| `CACHE` | `SVGIsolateCache` | — | Cache instance. Created automatically by `define()` if `CACHE_ENABLED` is `true` |
| `sanitize` | `Function \| null` | `null` | Static sanitizer function. Receives a raw SVG string and returns a sanitized string |
| `defaults` | `object` | — | Default values for all instance properties. See [Defaults](#defaults) |
| `LOADING` | `object` | — | Enum of valid loading strategy values. See [Loading Strategies](#loading-strategies) |

### `sanitize`

Static sanitizer function applied to the raw SVG string before rendering, when the `sanitize` attribute is present on the instance. Must be set before any component renders.

| Parameter | Type | Description |
|-----------|------|-------------|
| `raw` | `string` | Raw SVG string fetched from the source |

Returns `string` — the sanitized SVG string.

```js
import DOMPurify from 'dompurify';

SVGIsolate.sanitize = (raw) => {
    return DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true } });
};
```

The sanitizer runs after the fetch and before `renderSVG`, so the cache always stores the raw unsanitized string.

<br>

### Defaults

```js
SVGIsolate.defaults = {
    loading: 'eager',
    lazyThreshold: 0,
    lazyMargin: '0px',
    sanitize: false,
    useCache: true,
    responsive: false
}
```

### LOADING

```js
SVGIsolate.LOADING = {
    EAGER: 'eager',
    DEFER: 'defer',
    IDLE: 'idle',
    LAZY: 'lazy'
}
```

<br>

## Static Methods

#### `define(tagName?, styleSheets?)`

Registers the custom element and initializes the cache and stylesheets. Must be called before using the component unless using the auto-import bundle.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tagName` | `string \| null` | `'svg-isolate'` | Tag name to register the element under |
| `styleSheets` | `object` | `{}` | Stylesheets to inject into the shadow DOM |
| `styleSheets.links` | `string[]` | `[]` | URLs of external CSS files |
| `styleSheets.adopted` | `CSSStyleSheet[]` | `[]` | Constructed stylesheet objects |
| `styleSheets.raw` | `string[]` | `[]` | Raw CSS strings |

Returns `void`.

```js
SVGIsolate.define('my-icon', {
    links: ['/styles/icon.css'],
    raw: [':host { display: inline-block; }']
});
```

---

#### `fetchSVG(src, opt?)`

Fetches an SVG file from the given URL. Returns `null` on network error or non-ok HTTP response.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | `string` | — | URL of the SVG file |
| `opt.sanitize` | `boolean` | `false` | Whether to sanitize the SVG after fetching. Requires `SVGIsolate.sanitize` to be set |

Returns `Promise<string | null>`.

```js
const raw = await SVGIsolate.fetchSVG('/assets/icon.svg');
const sanitized = await SVGIsolate.fetchSVG('/assets/icon.svg', { sanitize: true });
```

---

#### `resolveSource(candidates, width)`

Returns the best candidate from a srcset candidates array for the given width. Picks the smallest candidate whose intrinsic width covers the given width. If the width exceeds all candidates, returns the largest.

| Parameter | Type | Description |
|-----------|------|-------------|
| `candidates` | `Array<{ url: URL, width: number }>` | Parsed srcset candidates, typically from `el.sources.candidates` |
| `width` | `number` | Target width in pixels |

Returns `{ url: URL, width: number } | null`.

```js
const { candidates } = el.sources;
const best = SVGIsolate.resolveSource(candidates, 450);

console.log(best.url.href); // 'icon-600.svg'
console.log(best.width);    // 600
```

<br>

## Instance Properties

| Property | Type | Attribute | Default | Description |
|----------|------|-----------|---------|-------------|
| `src` | `string \| null` | `src` | `null` | URL of the SVG file to load |
| `srcset` | `string \| null` | `srcset` | `null` | Comma-separated list of SVG candidates with width descriptors |
| `sources` | `object` | — | — | Parsed `src` and `srcset` as structured URL objects. Read-only |
| `loading` | `string` | `loading` | `'eager'` | Loading strategy. One of `eager`, `defer`, `idle`, `lazy` |
| `useCache` | `boolean` | `no-cache` | `true` | Whether to use the in-memory cache for this instance |
| `sanitize` | `boolean` | `sanitize` | `false` | Whether to sanitize the SVG before rendering |
| `responsive` | `boolean` | `responsive` | `false` | Whether to listen for resize events and swap candidates automatically |
| `lazyMargin` | `string` | `lazy-margin` | `'0px'` | `rootMargin` passed to the `IntersectionObserver` for lazy loading |
| `lazyThreshold` | `number` | `lazy-threshold` | `0` | `threshold` passed to the `IntersectionObserver` for lazy loading |
| `preserveAspectRatio` | `string \| null` | `preserveAspectRatio` | `null` | Forwarded to the rendered `<svg>` element |
| `viewBox` | `string \| null` | `viewBox` | `null` | Forwarded to the rendered `<svg>` element |
| `observers` | `Map` | — | — | Active observers keyed by name (`'lazy'`, `'resize'`). Read-only |
| `exposeSVG` | `string \| boolean \| null` | `expose-svg` | `null` | Exposes the inner `<svg>` via `::part()`. `true` uses `'svg'` as the part name, a string sets a custom name, `null` disables it |

### `sources`

Read-only computed property that parses `src` and `srcset` into structured objects with absolute URLs. Useful when you need to inspect or work with the resolved URLs programmatically.

| Field | Type | Description |
|-------|------|-------------|
| `default` | `URL \| null` | Resolved absolute URL from the `src` attribute. `null` if `src` is not set |
| `candidates` | `Array<{ url: URL, width: number }>` | Parsed candidates from `srcset` in declaration order. Each entry contains the resolved absolute URL and the intrinsic width in pixels from the `w` descriptor. Candidates without a descriptor default to `width: 0` |

```js
// Given:
// src="icon.svg"
// srcset="/assets/icon-300.svg 300w, /assets/icon-600.svg 600w"

el.sources
// {
//   default: URL { href: 'https://example.com/icon.svg', ... },
//   candidates: [
//     { url: URL { href: 'https://example.com/assets/icon-300.svg', ... }, width: 300 },
//     { url: URL { href: 'https://example.com/assets/icon-600.svg', ... }, width: 600 },
//   ]
// }
```

Both `default` and candidate URLs are resolved against `document.baseURI`, so relative paths are always returned as absolute URLs.

```js
// relative src
el.src = 'icons/arrow.svg';
el.sources.default.href // 'https://example.com/icons/arrow.svg'
```

Candidates without a **width descriptor** default to `0`:

```js
// srcset="icon-fallback.svg, icon-300.svg 300w"
el.sources.candidates
// [
//   { url: URL { href: '...icon-fallback.svg' }, width: 0 },
//   { url: URL { href: '...icon-300.svg' },      width: 300 },
// ]
```

Malformed candidates are silently dropped — the rest of the candidates remain unaffected.


<br>

## Instance Methods

#### `loadSVG(src)`

Fetches and renders an SVG from the given URL. Respects `useCache` and `sanitize` settings.

| Parameter | Type | Description |
|-----------|------|-------------|
| `src` | `string` | URL of the SVG file to load |

Returns `Promise<void>`.

```js
await el.loadSVG('/assets/icon.svg');
```

---

#### `renderSVG(svg)`

Renders an SVG into the shadow DOM. Dispatches the `ready` event and sets the `ready` attribute on completion.

| Parameter | Type | Description |
|-----------|------|-------------|
| `svg` | `string \| SVGElement` | Raw SVG string or an SVG DOM node |

Returns `void`.

```js
el.renderSVG('<svg xmlns="http://www.w3.org/2000/svg">...</svg>');

// or from a DOM node
const node = document.querySelector('svg');
el.renderSVG(node);
```

---

#### `dispose()`

Disconnects all active observers, removes the rendered SVG from the shadow DOM, and resets the `ready` state. Called automatically on `disconnectedCallback`.

Returns `void`.

```js
el.dispose();
```

<br>

## Attributes

### Reactive attributes

Changes to these attributes are observed and trigger the component to update automatically.

| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | `string` | Path to the SVG file. Triggers a reload when changed. Ignored if `srcset` is present |
| `srcset` | `string` | Comma-separated srcset candidates. Takes priority over `src`. Triggers a reload when changed |
| `preserveAspectRatio` | `string` | Forwarded directly to the rendered `<svg>` without triggering a reload |
| `viewBox` | `string` | Forwarded directly to the rendered `<svg>` without triggering a reload |

### Behavioral attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `loading` | `string` | `eager` | Loading strategy. One of `eager`, `defer`, `idle`, `lazy` |
| `responsive` | `boolean` | `false` | Enables automatic candidate swapping on resize |
| `no-cache` | `boolean` | `false` | Disables in-memory caching for this instance |
| `sanitize` | `boolean` | `false` | Enables sanitization before rendering. Requires `SVGIsolate.sanitize` to be set |
| `lazy-margin` | `string` | `0px` | Extends the viewport boundary before triggering a lazy load |
| `lazy-threshold` | `number` | `0` | Visibility ratio required before triggering a lazy load (0 to 1) |
| `expose-svg` | `string \| boolean` | `null` | Exposes the inner `<svg>` via `::part()`. Omitting a value uses `'svg'` as the default part name |

### State attributes

Set by the component to reflect its current state. Read-only.

| Attribute | Description |
|-----------|-------------|
| `ready` | Present when the SVG has been successfully rendered |
| `ready-links` | Present when all external stylesheets have finished loading |

---

## Events

#### `ready`

Fired when the SVG has been successfully rendered into the shadow DOM.

```js
el.addEventListener('ready', () => {
    console.log('SVG rendered');
});
```

#### `ready-links`

Fired when all external stylesheets injected via `links` have finished loading.

| Property | Type | Description |
|----------|------|-------------|
| `detail.results` | `Array` | Load result for each stylesheet |
| `detail.results[].href` | `string` | Stylesheet URL |
| `detail.results[].status` | `'loaded' \| 'error'` | Load result |

```js
el.addEventListener('ready-links', ({ detail }) => {
    console.log(detail.results);
    // [{ href: '/styles.css', status: 'loaded' }, ...]
});
```

## SVGIsolateCache

The cache instance accessible via `SVGIsolate.CACHE`. Created automatically by `define()` if `CACHE_ENABLED` is `true`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `values` | `Map<string, string>` | All cached SVG strings keyed by URL |
| `pending` | `Map<string, Promise>` | In-flight requests keyed by URL |
| `owner` | `typeof SVGIsolate` | The component class that owns this cache instance |
| `maxEntries` | `number` | Maximum number of entries before eviction |

### Methods

#### `fetchSVG(src, opt?)`

Fetches and caches an SVG string. If a request for the same URL is already in flight, returns the same Promise — no duplicate requests.

| Parameter | Type | Description |
|-----------|------|-------------|
| `src` | `string` | URL of the SVG file |
| `opt` | `object` | Options forwarded to `SVGIsolate.fetchSVG` |

Returns `Promise<string | null>`.

```js
// preload before any component renders
await SVGIsolate.CACHE.fetchSVG('/assets/icon.svg');
```

#### `has(src)`

Returns `boolean`. `true` if the URL is already cached.

#### `get(src)`

Returns `string | undefined`. The cached SVG string for the given URL.

#### `set(src, value)`

Manually adds an entry. Evicts the oldest entry if `maxEntries` is reached (FIFO).

#### `delete(src)`

Removes a specific entry. Returns `boolean`.

#### `clear()`

Removes all entries.

<br>

## Extending

`SVGIsolate` is designed to be subclassed. You can override static methods to customize fetching, sanitization, or add new behavior without modifying the base class.

### Custom fetch

Override `fetchSVG` to add headers, authentication, or any custom fetch logic:

```js
class MyIcon extends SVGIsolate {

    static async fetchSVG(src, opt = {}) {
        // add custom headers
        const response = await fetch(src, {
            headers: { 'Authorization': 'Bearer token' }
        });

        if(!response.ok) return null;

        return response.text();
    }
}

MyIcon.define('my-icon');
```

### Custom sanitizer

```js
class MyIcon extends SVGIsolate {}

MyIcon.sanitize = (raw) => {
    return DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true } });
};

MyIcon.define('my-icon');
```

### Custom defaults

```js
class MyIcon extends SVGIsolate {
    static defaults = {
        ...SVGIsolate.defaults,
        loading: 'lazy',
        responsive: true,
        sanitize: true
    }
}

MyIcon.define('my-icon');
```

Each subclass gets its own independent cache instance — two subclasses pointing to the same URL will not share cached results.