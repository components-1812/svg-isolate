![NPM Version](https://img.shields.io/npm/v/@components-1812/svg-isolate)
[![Custom Elements](https://img.shields.io/badge/custom--elements-standard-orange.svg?style=flat-flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
[![gzipped size](https://img.shields.io/bundlephobia/minzip/@components-1812/svg-isolate)](https://bundlephobia.com/package/@components-1812/svg-isolate)
[![GitHub stars](https://img.shields.io/github/stars/components-1812/svg-isolate?style=social)](https://github.com/components-1812/svg-isolate/stargazers)


# SVG Isolate Custom Element

![Id collision example](./assets/id-collision.webp)

## Features

- 🔒 **Shadow DOM isolation** — SVG styles and IDs are scoped to the component. No conflicts with the rest of the page.
- 📦 **Smart caching** — LRU in-memory cache with deduplication. Same URL fetched once, shared across all instances. Configurable by item count and byte size limit.
- 🖼️ **srcset support** — serve different SVG files based on the component's rendered width, just like native `<img srcset>`.
- ⚡ **Loading strategies** — `eager`, `defer`, `idle`, and `lazy` (via `IntersectionObserver`).
- 🔗 **Base URL** — resolve src against a configurable base path or CDN URL. Set per-element or globally via defaults.
- 🎨 **Flexible styling** — inject CSS into the shadow DOM globally via `define()` or per-instance via `componentStyles`.
- 🧹 **Optional sanitization** — plug in any sanitizer (e.g. DOMPurify) to clean SVG nodes before rendering.
- 📐 **Responsive** — automatic candidate swapping on resize via `ResizeObserver`.
- 🧩 **Extensible** — designed to be subclassed. Override fetching, sanitization, rendering, or defaults.

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Custom definition](#custom-definition)
- [Instance styles](#instance-styles)
- [Default styles](#default-styles-bundle)
- [`width` and `height`](#width-and-height)
- [Base URL](#base-url)
- [Cache](#cache)
- [Loading Strategies](#loading-strategies)
- [srcset & Responsive](#srcset--responsive)
- [Sanitize](#sanitize)
- [Styling the inner SVG](#styling-the-inner-svg)
- [Attributes](#attributes)
- [Events](#events)

## Examples

- [**Stackblitz Examples**](https://stackblitz.com/edit/stackblitz-starters-pof6s1fk?file=index.html)

<br>

<!--MARK: Installation -->

## Installation

### NPM

```bash
npm install @components-1812/svg-isolate
```

### CDN

#### Auto-define (recommended)

Loads the bundle and registers `<svg-isolate>` automatically with default styles included.

```html
<script type="module">
	import "https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate/dist/index.bundle.min.js";
</script>
```

#### Manual definition

Use this if you need a custom tag name or want to provide your own styles.

```html
<script type="module">
	import SVGIsolate from "https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate/dist/SVGIsolate.min.js";

	SVGIsolate.define("custom-svg-isolate", {
		links: [
			"https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate/dist/SVGIsolate.min.css",
		],
	});
</script>
```

### Available files

| File                 | jsdelivr                                                                                  | unpkg                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Bundle (recommended) | [link](https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate/dist/index.bundle.min.js)      | [link](https://unpkg.com/@components-1812/svg-isolate/dist/index.bundle.min.js)      |
| SVGIsolate.js        | [link](https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate/dist/SVGIsolate.min.js)  | [link](https://unpkg.com/@components-1812/svg-isolate/dist/SVGIsolate.min.js)  |
| SVGIsolate.css       | [link](https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate/dist/SVGIsolate.min.css) | [link](https://unpkg.com/@components-1812/svg-isolate/dist/SVGIsolate.min.css) |

<br>

<!-- MARK: Usage -->

## Usage

Import the component in a client-side script file:

```js
import "@components-1812/svg-isolate";
```

> This loads the bundle, auto-defines the custom element as `<svg-isolate>`, and applies the default styles via `adoptedStyleSheets`.

```html
<!-- inline SVG -->
<svg-isolate>
	<svg width="200" height="200"><!-- SVG content --></svg>
</svg-isolate>

<!-- load from file -->
<svg-isolate src="path/to/circle.svg" />

<svg-isolate src="path/to/hexagon.svg" loading="lazy" />

<svg-isolate srcset="icon-300.svg 300w, icon-600.svg 600w" />
```

<br>

<!--MARK: Custom Definition-->
## Custom definition

If you need to register the element under a different tag name or inject custom styles into its shadow DOM, use `SVGIsolate.define()` directly instead of the auto-import.

#### Via `adoptedStyleSheets`

Best for programmatically constructed styles or when working with a build system that produces `CSSStyleSheet` objects.

```js
import SVGIsolate from "@components-1812/svg-isolate/SVGIsolate.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(`:host { display: inline-block; }`);

SVGIsolate.define("custom-svg-isolate", { adopted: [sheet] });
```

#### Via raw CSS string

Best for inlining styles directly without an external file.

```js
import SVGIsolate from "@components-1812/svg-isolate/SVGIsolate.js";

SVGIsolate.define("custom-svg-isolate", {
	raw: [`:host { display: inline-block; }`],
});
```

#### Via external stylesheet

Best for loading styles from a CSS file at runtime. URLs are resolved against `document.baseURI`, so relative paths are accepted.

```js
import SVGIsolate from "@components-1812/svg-isolate/SVGIsolate.js";

SVGIsolate.define(null, { links: ["/path/to/styles.css"] });
```

All three options can be combined in a single `define()` call:

```js
SVGIsolate.define("custom-svg-isolate", {
	adopted: [sheet],
	raw: [":host { display: block; }"],
	links: ["/path/to/styles.css"],
});
```

Duplicate entries are ignored automatically — adding the same URL or `CSSStyleSheet` object twice has no effect.

<!--MARK: Instance styles-->

## Instance styles

Every `<svg-isolate>` element exposes a `componentStyles` property — a `ComponentStyles` instance that controls the styles injected into its shadow DOM. You can add or replace styles on a specific element at any time without affecting other instances.

### Adding styles

`componentStyles.add()` accepts the same `{ links, adopted, raw }` shape as `define()`. Chain `.apply()` to re-render the shadow DOM styles immediately.

```js
const el = document.querySelector("svg-isolate");

el.componentStyles
    .add({ raw: [`:host { outline: 2px solid red; }`] })
    .apply();
```

Duplicate entries are ignored — adding the same URL or raw string twice has no effect.

### Targeting SVG internals

CSS injected this way lives inside the shadow root, so it can reach the SVG elements directly:

```js
document.querySelector('svg-isolate[sanitize]')
    .componentStyles
    .add({
        raw: `
            circle { fill: #5f000d; }
            rect   { fill: #070070; }
            text   { fill: #c5b800; font-family: serif; }
        `,
	})
	.apply();
```

### Working with the collections directly

Each style type is a `StyleCollection` instance and can be manipulated directly before calling `.apply()`:

```js
const { raw, links, adopted } = el.componentStyles;

// check what's already registered
console.log(raw.size); // number of raw CSS strings
console.log(links.size); // number of external stylesheets

// check if a specific entry exists
links.has("https://example.com/theme.css");

// iterate over current entries
for (const url of links) {
	console.log(url);
}

// remove everything from one collection and replace it
raw.clear();
raw.add([`circle { fill: hotpink; }`]);

el.componentStyles.apply();
```

### Adding an external stylesheet to one instance

```js
el.componentStyles.add({ links: ["/themes/dark.css"] }).apply();
```

The `ready-links` event fires once the stylesheet has loaded.

### Replacing all styles

Call `.clear()` before `.add()` to discard everything and start fresh:

```js
el.componentStyles
	.clear()
	.add({ raw: [`:host { background: #000; }`] })
	.apply();
```

> **Note:** `componentStyles` is per-instance. Changes made to one element do not affect other `<svg-isolate>` elements on the page, even if they share the same `src`.

<br>

<!--MARK: Default styles -->
## Default styles (bundle)

When loaded via the auto-import bundle, <svg-isolate> ships with these default host styles:

```css
:host {
	position: relative;
	display: inline-block;

	margin: 0;
	padding: 0;
	width: 100%;
	height: 100%;

	contain: size;

	overflow: hidden;
}
:host svg {
	display: block;
	width: 100%;
	height: 100%;
}
```

From: [/src/SVGIsolate.css](/src/SVGIsolate.css)
The most important of these is `contain: size` — it prevents the component from triggering
layout recalculations in its parent (particularly relevant inside `flex` and `grid` containers,
where an unsized inline element can cause repeated reflows).

If you register the component manually via `SVGIsolate.define()`, none of these styles are applied automatically.
You can inject them (or a modified version) via the `adopted`, `raw`, or `links` options — see [Custom definition](#custom-definition).

Note that `width: 100%; height: 100%` means the component sizes itself to its container —
if the container has no explicit dimensions, the component collapses to zero.
Use the [`width` and `height` attributes](#width-and-height) or size the container from CSS.

To override the defaults on a specific instance without touching others, use `componentStyles` directly:

```js
el.componentStyles
	.clear()
	.add({ raw: [`:host { display: block; width: 300px; height: 300px; }`] })
	.apply();
```

See [Instance styles](#instance-styles) for the full API.

<br>

<!--MARK: width and height-->

## `width` and `height`

Sets `style.width` and `style.height` on the `<svg-isolate>` host element directly.

```html
<svg-isolate src="icon.svg" width="200px" height="200px" />
<svg-isolate src="banner.svg" width="100%" height="4rem" />
```

```js
el.width = "50%";
el.height = "120px";
```

Accepts any valid CSS length value. Equivalent to setting `style.width` / `style.height` inline — useful when you want to control dimensions declaratively via HTML rather than in your stylesheet.

<br>

<!--MARK: Base URL -->
## Base URL

You can provide a `base` attribute to resolve the `src` URL against a specific base path rather than the document's base URI.

The `base` is always a fixed URL to which the `src` is concatenated. If `base` is relative, it is resolved against `document.baseURI`. Then, if `src` is also relative, its resolved path is appended to the `base`.

The resulting URL follows this structure:

```txt
<base origin>/<base path>/<src path>?<src query>#<src hash>
```

- The default value of `base` is `"/"`.
- If `src` is an absolute URL, `base` is ignored entirely and `src` is used as-is.
- The resolution logic is handled internally by the static method `SVGIsolate.resolveSource(src, base)`

### Usage

```html
<svg-isolate src="/icons/circle.svg" base="/assets"></svg-isolate>
<svg-isolate src="circle.svg" base="https://cdn.example.com"></svg-isolate>
```

```js
el.base = "/assets";
```

### Setting a default base

To apply a fixed `base` to all instances of a custom element, set it in `SVGIsolate.defaults.base` before calling `define()`:

```js
class BootstrapIcon extends SVGIsolate {
	static defaults = {
		...super.defaults,
		base: "https://raw.githubusercontent.com/twbs/icons/refs/heads/main/icons",
	};
}

BootstrapIcon.define("bootstrap-icon", {
	links: [
		"https://cdn.jsdelivr.net/npm/@components-1812/svg-isolate@0.0.2/dist/SVGIsolate.min.css",
	],
});
```

Now every `<bootstrap-icon>` resolves `src` against that CDN path without needing `base` on each element:

```html
<bootstrap-icon src="circle.svg"></bootstrap-icon>
<!-- → https://raw.githubusercontent.com/twbs/icons/refs/heads/main/icons/circle.svg -->
```

### Examples

Here are a few representative examples of how different inputs are resolved (assuming a document URI of `http://127.0.0.1:3000/docs/examples/base-test/`):

| `src`                                | `base`                    | Resolved URL                                                                 | Description                                         |
| :----------------------------------- | :------------------------ | :--------------------------------------------------------------------------- | :-------------------------------------------------- |
| `https://raw.example.com/circle.svg` | `/docs`                   | `https://raw.example.com/circle.svg`                                         | Absolute URL `src`, `base` is ignored               |
| `/assets/circle.svg`                 | `/docs`                   | `http://127.0.0.1:3000/docs/assets/circle.svg`                               | Root-relative `src` treated relative to `base` path |
| `../../../assets/circle.svg`         | `/docs`                   | `http://127.0.0.1:3000/docs/assets/circle.svg`                               | Root-relative nested `src` with path `base`         |
| `/0-circle.svg`                      | `https://raw.example.com` | `https://raw.example.com/0-circle.svg`                                       | Root-relative `src` with absolute domain `base`     |
| `circle.svg`                         | `/`                       | `http://127.0.0.1:3000/docs/examples/base-test/circle.svg`                   | Relative `src` with default `base`                  |
| `assets/circle?w=150#svg`            | `/docs`                   | `http://127.0.0.1:3000/docs/docs/examples/base-test/assets/circle?w=150#svg` | With query params and hash                          |

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
const svg = document.querySelector("svg-isolate");
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

### Limits & Eviction

By default, the cache holds up to `100` entries with no maximum cumulative byte size limit (`Infinity`). When limits are reached, the least recently used entry is evicted before adding the new one (LRU):

```js
// Evict after 50 items
SVGIsolate.CACHE_MAX_ENTRIES = 50;

// Evict after 10 Megabytes of accumulated SVG strings
SVGIsolate.CACHE_MAX_SIZE = '10mb'; // Also accepts '500kb', '1.5g', or raw bytes like 5000000
```

Both must be set **before** calling `SVGIsolate.define()`.

### Shared cache

The cache is shared across all instances of the same component class. Two `<svg-isolate>` elements pointing to the same `src` will only trigger one fetch — the second reuses the cached result.

### Accessing the cache directly

```js
SVGIsolate.CACHE.clear(); // clear all entries
SVGIsolate.CACHE.delete(src); // remove a specific entry
SVGIsolate.CACHE.has(src); // check if a src is cached
SVGIsolate.CACHE.values; // Map with all cached entries
```

#### Preloading

You can manually populate the cache before any component renders:

```js
await SVGIsolate.CACHE.fetchSVG("/assets/icon.svg");
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
SVGIsolate.defaults.loading = "lazy";
```

<br>

<!--MARK: Responsive -->

## srcset & Responsive

`<svg-isolate>` supports `srcset` to serve different SVG files depending on the component's rendered **width**, similar to how native `<img srcset>` works.

### Basic usage

Each candidate requires a width descriptor (`w`) representing the intrinsic width the SVG was designed for.

If no descriptor is provided, the candidate defaults to `0w`.

```html
<svg-isolate srcset="icon-300.svg 300w, icon-600.svg 600w, icon-900.svg 900w" />
```

### src and srcset

`src` and `srcset` are mutually exclusive. If `srcset` is present, `src` is ignored entirely — `srcset` always takes priority.

```html
<!-- only srcset is used, src is ignored -->
<svg-isolate src="icon.svg" srcset="icon-300.svg 300w, icon-600.svg 600w" />
```

This also applies when attributes change dynamically — if `srcset` is set at any point, `src` stops being considered until `srcset` is removed.

```js
const el = document.querySelector("svg-isolate");

el.srcset = "icon-300.svg 300w, icon-600.svg 600w"; // src ignored from now on
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

<!--MARK: Sanitize -->

## Sanitize

`<svg-isolate>` renders SVG files inside a shadow DOM using `DOMParser` and `appendChild`. This means:

- `<script>` tags are **never executed** — the browser does not evaluate scripts inserted via `DOMParser` + `append`.
- CSS inside `<style>` tags is **encapsulated** by the shadow DOM — selectors like `body`, `p`, or `div` cannot escape and affect the rest of the page.

Sanitization is therefore not required for security in most cases. Its purpose is to **clean up the SVG DOM** — removing nodes like `<script>`, `<style>`, or inline `style` attributes that you don't want present in the shadow root, even if they are inert.

---

### `SVGIsolate.sanitize` — static function

Set a static sanitizer function before any component renders. It receives the raw SVG string and returns the cleaned string. If not set, sanitization is skipped even when the `sanitize` attribute is present.

```js
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.es.mjs";

SVGIsolate.sanitize = (raw) => {
	return DOMPurify.sanitize(raw, {
		USE_PROFILES: { svg: true },
		FORBID_TAGS: ["style", "script"],
		FORBID_ATTR: ["style"],
	});
};
```

The sanitizer runs after the fetch and before `renderSVG`, so the cache always stores the raw unsanitized string.

---

### `sanitize` — instance attribute and property

Controls whether the sanitizer is applied to a specific instance. Has no effect if `SVGIsolate.sanitize` is not set.

```html
<!-- sanitize this instance -->
<svg-isolate src="icon.svg" sanitize />

<!-- leave this one unsanitized -->
<svg-isolate src="icon.svg" />
```

```js
el.sanitize = true;
el.sanitize = false;
```

### Enabling by default

To sanitize all instances without adding the attribute to each one:

```js
SVGIsolate.defaults.sanitize = true;
```

<br>

<!-- MARK: Styling the inner SVG -->

## Styling the inner SVG

The SVG rendered inside `<svg-isolate>` lives in a shadow DOM, so external CSS cannot reach it directly. The component provides a few ways to interact with it.

---

### `viewBox`

Sets the `viewBox` attribute on the inner `<svg>` element. Useful for cropping or reframing the SVG coordinate system without modifying the source file.

```html
<svg-isolate src="icon.svg" viewBox="0 0 100 100" />
```

```js
el.viewBox = "0 0 50 50";
```

Changing this attribute dynamically updates the rendered SVG immediately without triggering a reload.

---

### `preserveAspectRatio`

Sets the `preserveAspectRatio` attribute on the inner `<svg>` element. Controls how the SVG scales within its viewport.

```html
<svg-isolate src="icon.svg" preserveAspectRatio="xMidYMid meet" />
```

```js
el.preserveAspectRatio = "xMinYMin slice";
```

Changing this attribute dynamically updates the rendered SVG immediately without triggering a reload.

---

### `expose-svg`

Adds a `part` attribute to the inner `<svg>` element, making it accessible via `::part()` from external CSS.

```html
<!-- expose with default part name "svg" -->
<svg-isolate src="icon.svg" expose-svg />

<!-- expose with a custom part name -->
<svg-isolate src="icon.svg" expose-svg="my-icon" />
```

```css
/* default name */
svg-isolate::part(svg) {
	fill: red;
	transform: rotate(45deg);
}

/* custom name */
svg-isolate::part(my-icon) {
	fill: red;
}
```

> **Note:** `::part()` gives access to the `<svg>` tag itself. Its children (`path`, `circle`, etc.) remain encapsulated and cannot be targeted from outside. Use [CSS custom properties](#css-custom-properties) to style internals.

#### Enable for all instances

```js
SVGIsolate.defaults.exposeSVG = true; // exposes with default part name 'svg'
SVGIsolate.defaults.exposeSVG = "custom-name"; // exposes with a custom part name
```

---

### CSS custom properties

CSS custom properties penetrate the shadow DOM boundary, making them the most flexible way to style SVG internals.

Define the custom property on the component and consume it inside the shadow DOM styles:

```css
svg-isolate {
	--svg-fill: red;
	--svg-stroke: blue;
}
```

```js
// when defining the component, inject a style that consumes the custom properties
SVGIsolate.define("svg-isolate", {
	raw: `
        svg * {
            fill: var(--svg-fill, currentColor);
            stroke: var(--svg-stroke, none);
        }
    `,
});
```

This approach works for any CSS property regardless of shadow DOM encapsulation.

<br>

<!--MARK: Attributes -->

## Attributes

### Reactive

| Attribute             | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `src`                 | Path to the SVG file. Triggers a reload when changed. Ignored if `srcset` is present                |
| `srcset`              | Comma-separated srcset candidates. Takes priority over `src`. Triggers a reload when changed        |
| `preserveAspectRatio` | Forwarded directly to the inner `<svg>` without triggering a reload                                 |
| `viewBox`             | Forwarded directly to the inner `<svg>` without triggering a reload                                 |
| `width`               | Sets `style.width` on the host element. Accepts any valid CSS length (e.g. `200px`, `50%`, `10rem`) |
| `height`              | Sets `style.height` on the host element. Accepts any valid CSS length                               |

### Behavioral

| Attribute        | Default | Description                                                                    |
| ---------------- | ------- | ------------------------------------------------------------------------------ |
| `base`           | `/`     | Base path or URL to prepend to the `src`.                                      |
| `loading`        | `eager` | Loading strategy. One of `eager`, `defer`, `idle`, `lazy`                      |
| `responsive`     | `false` | Enables automatic candidate swapping on resize                                 |
| `no-cache`       | `false` | Disables in-memory caching for this instance                                   |
| `sanitize`       | `false` | Enables sanitization before rendering                                          |
| `lazy-margin`    | `0px`   | Viewport margin before triggering lazy load                                    |
| `lazy-threshold` | `0`     | Visibility ratio before triggering lazy load (0 to 1)                          |
| `expose-svg`     | —       | Exposes the inner `<svg>` via `::part()`. Accepts an optional custom part name |

### State (read-only)

| Attribute     | Description                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| `fetching`    | Present while the SVG is being fetched. Removed once the fetch completes      |
| `ready`       | Present when the SVG has been successfully rendered                           |
| `ready-links` | Present when all external stylesheets have finished loading                   |

Use these attributes to drive CSS transitions or show loading states while the component initializes.

```css
/* show a spinner while fetching */
svg-isolate[fetching] {
	background: url('spinner.svg') center / 24px no-repeat;
}
```

```css
svg-isolate {
	opacity: 0;
	transition: opacity 0.3s;
}
svg-isolate[ready] {
	opacity: 1;
}
```

```css
svg-isolate:not([ready-links]) {
	opacity: 0;
}
svg-isolate[ready-links] {
	opacity: 1;
}
```

<br>

## Events

| Event         | Description                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `fetching`    | Fired every time a fetch is about to start — on load, on `src`/`srcset` changes, and on srcset candidate swaps       |
| `ready`       | Fired every time an SVG is successfully rendered — on load, on `src`/`srcset` changes, and on srcset candidate swaps |
| `ready-links` | Fired once when all external stylesheets injected via `links` have finished loading                                  |

<br>

### Event detail

#### `fetching`

```js
el.addEventListener("fetching", (e) => {
	const { src, resolved } = e.detail;
	// src      — the raw value from the src/srcset attribute
	// resolved — URL object with the fully resolved href
});
```

#### `ready`

No `detail`. The SVG is already in the shadow root when the event fires.

```js
el.addEventListener("ready", (e) => {
	const svg = e.target.shadowRoot.querySelector("svg");
});
```

#### `ready-links`

```js
el.addEventListener("ready-links", (e) => {
	const { results } = e.detail;
	// results — array of settled outcomes, one per <link> injected via `links`
	// each entry: { link: HTMLLinkElement, href: string, status: "loaded" | "error" }
});
```

<br>

> For full API documentation including properties, methods, return types and parameters, see [docs/api.md](./docs/api.md).


<br>

## License

MIT
