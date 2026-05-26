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

Adds one or more entries. If the first argument is an iterable (`Array`, `Set`, or another `StyleCollection`), it adds its contents. Otherwise, it treats all arguments as individual items to add:

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

#### Built-in Validation & Mapping

When entries are added to these collections, they are automatically validated and mapped:

- **`adopted`**: Validates that the entry is an instance of `CSSStyleSheet`.
- **`links`**: Validates that the entry is a non-empty string and a valid URL. It resolves relative paths against `document.baseURI` and stores the **absolute URL string** (`.href`).
- **`raw`**: Validates that the entry is a string.

Because `links` normalizes URLs, `has()` must be checked against the absolute URL:

```js
SVGIsolate.define('svg-isolate', { links: ['/styles/icon.css'] });

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

Injects the current collections into the element's shadow DOM. Returns `this`.

Calling `apply()` replaces the previously injected styles entirely — it does not merge with what was there before.

**Internal execution flow:**
1. Removes the `ready-links` attribute from the element.
2. Creates a hidden container `<div class="styles" style="display: none;">` to hold `<style>` and `<link>` tags without interfering with the SVG DOM.
3. Appends all `<link>` elements to the container and tracks their load status.
4. Appends all raw CSS strings as `<style>` elements to the container.
5. Removes any previous `.styles` container from the shadow root.
6. Prepends the new `.styles` container to the shadow root.
7. Replaces `shadowRoot.adoptedStyleSheets` with the `adopted` collection.
8. Fires the `ready-links` event and sets the `ready-links` attribute once all `<link>` elements have settled (loaded or errored).

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

When `links` entries are present, `apply()` fires `ready-links` once all of them have loaded. The event detail contains the HTML `<link>` element and its load status:

```js
el.addEventListener('ready-links', ({ detail }) => {
    console.log(detail.results);
    // [
    //   { 
    //     link: HTMLLinkElement, 
    //     href: 'https://example.com/themes/dark.css', 
    //     status: 'loaded' 
    //   }
    // ]
});

el.componentStyles
    .add({ links: ['/themes/dark.css'] })
    .apply();
```

### Targeting SVG internals from an instance

Since styles injected via `componentStyles` live inside the shadow root (in the `<div class="styles">`), they can reach the SVG elements directly — no need for `::part()` or CSS custom properties:

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