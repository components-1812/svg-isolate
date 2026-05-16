# Style System

The style system is composed of three classes: `StyleCollection`, `ComponentStyleSheets`, and `ComponentStyles`. Together they handle validation, deduplication, and injection of CSS into the shadow DOM.

---

## `StyleCollection`

A typed, deduplicated set of style entries. Each collection holds one kind of style — raw CSS strings, external URLs, or `CSSStyleSheet` objects. Entries are validated on insertion and silently ignored if invalid.

### Constructor

```js
new StyleCollection({ validator?, mapper? })
```

| Parameter   | Type                       | Default              | Description                                              |
| ----------- | -------------------------- | -------------------- | -------------------------------------------------------- |
| `validator` | `(value) => boolean`       | `() => true`         | Called before inserting. Entry is dropped if it returns `false` |
| `mapper`    | `(value) => value`         | `(value) => value`   | Transforms the value before storing it                   |

You rarely construct `StyleCollection` directly — it's created internally by `ComponentStyleSheets` for each style type.

### Properties

| Property | Type     | Description                        |
| -------- | -------- | ---------------------------------- |
| `size`   | `number` | Number of entries in the collection |

### Methods

#### `add(...values)`

Adds one or more entries. Accepts a single value, multiple values as rest params, or a single iterable (`Array`, `Set`, or another `StyleCollection`):

```js
collection.add('circle { fill: red; }');
collection.add('circle { fill: red; }', 'rect { fill: blue; }');
collection.add(['circle { fill: red; }', 'rect { fill: blue; }']);
```

Duplicates are ignored — inserting the same value twice has no effect. Returns `this`.

#### `has(value)`

Returns `boolean`. `true` if the value is already in the collection. For `links`, check against the normalized absolute URL string.

#### `clear()`

Removes all entries. Returns `this`.

#### `toArray()`

Returns `Array` — a snapshot of all current entries.

#### `[Symbol.iterator]`

Entries are iterable:

```js
for (const url of el.componentStyles.links) {
    console.log(url); // normalized absolute URL string
}
```

---

## `ComponentStyleSheets`

A container that holds three `StyleCollection` instances — one per style type. Used as the **static-level** style registry: when you call `SVGIsolate.define()`, the styles you pass are stored here and shared across all instances of that element.

```js
SVGIsolate.styleSheets // → ComponentStyleSheets instance
```

### Constructor

```js
new ComponentStyleSheets({ links?, adopted?, raw? })
```

Accepts an initial styles object. All three properties are optional.

### Properties

| Property  | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| `links`   | `StyleCollection` | External CSS file URLs                     |
| `adopted` | `StyleCollection` | `CSSStyleSheet` objects                    |
| `raw`     | `StyleCollection` | Raw CSS strings                            |

#### URL normalization

Entries added to `links` are validated with `URL.canParse()` and normalized to absolute URLs via `new URL(value, document.baseURI)`. Relative paths are accepted and resolved automatically:

```js
// relative path
SVGIsolate.define('svg-isolate', { links: ['/styles/icon.css'] });

// stored internally as:
// 'https://example.com/styles/icon.css'
```

This means `has()` must be checked against the normalized form:

```js
SVGIsolate.styleSheets.links.has('https://example.com/styles/icon.css'); // true
SVGIsolate.styleSheets.links.has('/styles/icon.css');                     // false
```

### Methods

#### `add({ links?, adopted?, raw? })`

Adds entries to one or more collections at once. Returns `this`.

```js
SVGIsolate.styleSheets.add({
    raw: [':host { display: block; }'],
    links: ['/themes/dark.css']
});
```

#### `clear()`

Clears all three collections at once. Returns `this`.

```js
SVGIsolate.styleSheets.clear();
```

---

## `ComponentStyles`

Extends `ComponentStyleSheets`. Bound to a specific element instance at construction time — when the instance is created, a `ComponentStyles` is instantiated with that element as owner and initialized from the shared `SVGIsolate.styleSheets`.

```js
// internally, in the constructor:
this.componentStyles = new ComponentStyles(this, this.constructor.styleSheets);
```

This means every instance starts with a copy of the class-level styles, but any subsequent changes are isolated to that instance and do not affect others.

### `apply()`

Injects the current collections into the element's shadow DOM and fires the `ready-links` event once all external stylesheets have loaded. Returns `this`.

```js
el.componentStyles.apply();
```

Calling `apply()` replaces the previously injected styles entirely — it does not merge with what was there before.

---

## Usage patterns

### Defining global styles at registration time

The standard way. Styles passed to `define()` are stored in `SVGIsolate.styleSheets` and applied to every instance:

```js
SVGIsolate.define('svg-isolate', {
    links: ['/styles/svg-isolate.css'],
    raw: [':host { display: block; }']
});
```

### Adding styles to a specific instance

Every `<svg-isolate>` element exposes `componentStyles`. Changes here only affect that element:

```js
const el = document.querySelector('svg-isolate');

el.componentStyles
    .add({ raw: [`circle { fill: hotpink; }`] })
    .apply();
```

### Working with the collections directly

```js
const { raw, links, adopted } = el.componentStyles;

// inspect
console.log(raw.size);
console.log(links.size);

// iterate
for (const url of links) {
    console.log(url); // absolute URL
}

// replace one collection without touching the others
raw.clear();
raw.add([`rect { fill: #1a1a2e; }`]);

el.componentStyles.apply();
```

### Replacing all styles on an instance

```js
el.componentStyles
    .clear()
    .add({
        links: ['/themes/dark.css'],
        raw: [`:host { outline: 2px solid red; }`]
    })
    .apply();
```

### Listening for external stylesheets

When `links` entries are present, `apply()` fires `ready-links` once all of them have loaded:

```js
el.addEventListener('ready-links', ({ detail }) => {
    console.log(detail.results);
    // [{ href: 'https://example.com/themes/dark.css', status: 'loaded' }]
});

el.componentStyles
    .add({ links: ['/themes/dark.css'] })
    .apply();
```

### Targeting SVG internals from an instance

Since styles injected via `componentStyles` live inside the shadow root, they can reach the SVG elements directly — no need for `::part()` or CSS custom properties:

```js
el.componentStyles
    .add({
        raw: [`
            circle { fill: #5f000d; }
            rect   { fill: #070070; }
            text   { fill: #c5b800; font-family: serif; }
        `]
    })
    .apply();
```