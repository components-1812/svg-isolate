// src/StyleSystem.js
var StyleCollection = class _StyleCollection {
  #set = /* @__PURE__ */ new Set();
  #validator;
  #mapper;
  constructor(params = {}) {
    const {
      validator = () => true,
      mapper = (value) => value
    } = params;
    this.#validator = validator;
    this.#mapper = mapper;
  }
  add(...values) {
    const items = Array.isArray(values[0]) || values[0] instanceof Set || values[0] instanceof _StyleCollection ? values[0] : values;
    for (const value of items) {
      if (this.#validator(value)) this.#set.add(this.#mapper(value));
    }
    return this;
  }
  clear() {
    this.#set.clear();
    return this;
  }
  get size() {
    return this.#set.size;
  }
  has(value) {
    return this.#set.has(value);
  }
  toArray() {
    return [...this.#set];
  }
  [Symbol.iterator]() {
    return this.#set.values();
  }
};
var ComponentStyleSheets = class {
  constructor(styles = {}) {
    this.adopted = new StyleCollection({
      validator: (value) => {
        return value instanceof CSSStyleSheet;
      }
    });
    this.links = new StyleCollection({
      validator: (value) => {
        return typeof value === "string" && value.trim().length > 0 && URL.canParse(value, document.baseURI);
      },
      mapper: (value) => {
        return new URL(value, document.baseURI).href;
      }
    });
    this.raw = new StyleCollection({
      validator: (value) => {
        return typeof value === "string";
      }
    });
    this.add(styles);
  }
  add(styles = {}) {
    const { raw, links, adopted } = styles;
    if (links) this.links.add(links);
    if (adopted) this.adopted.add(adopted);
    if (raw) this.raw.add(raw);
    return this;
  }
  clear() {
    this.links.clear();
    this.adopted.clear();
    this.raw.clear();
    return this;
  }
};
var ComponentStyles = class extends ComponentStyleSheets {
  #element;
  constructor(element, styles = {}) {
    super(styles);
    this.#element = element;
  }
  apply() {
    this.#element.removeAttribute("ready-links");
    const styles = document.createElement("div");
    styles.classList.add("styles");
    styles.style.display = "none";
    const promises = [];
    for (const url of this.links) {
      const { promise, reject, resolve } = Promise.withResolvers();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      if (link.sheet) {
        resolve({ link, href: url.href, status: "loaded" });
      } else {
        link.addEventListener("load", () => resolve({ link, href: url, status: "loaded" }));
        link.addEventListener("error", () => reject({ link, href: url, status: "error" }));
      }
      styles.append(link);
      promises.push(promise);
    }
    Promise.allSettled(promises).then((results) => {
      this.#element.dispatchEvent(
        new CustomEvent("ready-links", {
          detail: {
            results: results.map((r) => r.value || r.reason)
          }
        })
      );
      this.#element.setAttribute("ready-links", "");
    });
    for (const raw of this.raw) {
      const style = document.createElement("style");
      style.textContent = raw;
      styles.append(style);
    }
    this.#element.shadowRoot.querySelector(".styles")?.remove();
    this.#element.shadowRoot.prepend(styles);
    this.#element.shadowRoot.adoptedStyleSheets = this.adopted.toArray();
    return this;
  }
};

// src/SVGIsolateCache.js
var SVGIsolateCache = class {
  #values = /* @__PURE__ */ new Map();
  #pending = /* @__PURE__ */ new Map();
  #owner;
  constructor(owner, maxEntries = 100) {
    this.#owner = owner;
    this.maxEntries = maxEntries;
  }
  get values() {
    return this.#values;
  }
  get pending() {
    return this.#pending;
  }
  get owner() {
    return this.#owner;
  }
  set(src, value) {
    if (this.maxEntries <= 0) return;
    if (this.#values.size >= this.maxEntries) {
      const first = this.#values.keys().next().value;
      this.delete(first);
    }
    this.#values.set(src, value);
  }
  fetchSVG(src, opt = {}) {
    if (this.#values.has(src)) return Promise.resolve(this.#values.get(src));
    if (this.#pending.has(src)) return this.#pending.get(src);
    const promise = this.#owner.fetchSVG(src, opt).then((raw) => {
      if (raw) this.#values.set(src, raw);
      return raw;
    }).finally(() => this.#pending.delete(src));
    this.#pending.set(src, promise);
    return promise;
  }
  get(src) {
    return this.#values.get(src);
  }
  has(src) {
    return this.#values.has(src);
  }
  delete(src) {
    return this.#values.delete(src);
  }
  clear() {
    return this.#values.clear();
  }
};
var SVGIsolateCache_default = SVGIsolateCache;

// src/SVGIsolateBase.js
var SVGIsolateBase = class extends HTMLElement {
  static VERSION = "0.0.2";
  static DEFAULT_TAG_NAME = "svg-isolate";
  static LOADING = {
    LAZY: "lazy",
    EAGER: "eager",
    DEFER: "defer",
    IDLE: "idle"
  };
  static CACHE_ENABLED = true;
  static CACHE_MAX_ENTRIES = 100;
  static defaults = {
    loading: this.LOADING.EAGER,
    lazyThreshold: 0,
    lazyMargin: "0px",
    sanitize: false,
    useCache: true,
    responsive: false,
    exposeSVG: false,
    base: "/"
  };
  static sanitize = null;
  #observers = /* @__PURE__ */ new Map();
  get observers() {
    return this.#observers;
  }
  /**
   * @type {ComponentStyleSheets} Stylesheets to be applied to the component
   */
  static styleSheets = null;
  //MARK: define
  /**
   * Define the custom element and add stylesheets to it if not already defined.
   * @param {string} [tagName=this.constructor.DEFAULT_TAG_NAME] - The tag name to define the custom element.
   * @param {ComponentStyleSheets} [styleSheets={}] Append styles
   * @returns {void}
   */
  static define(tagName, styleSheets = {}) {
    tagName ??= this.DEFAULT_TAG_NAME;
    if (!window.customElements.get(tagName)) {
      if (this.CACHE_ENABLED) {
        this.CACHE = new SVGIsolateCache_default(this, this.CACHE_MAX_ENTRIES);
      }
      this.styleSheets = new ComponentStyleSheets(styleSheets);
      window.customElements.define(tagName, this);
    } else {
      console.warn(`Custom element with tag name "${tagName}" is already defined.`);
    }
  }
  //MARK: Fetching
  static async fetchSVG(src, opt = {}) {
    const { sanitize = false } = opt;
    try {
      const response = await fetch(src);
      if (response.ok) {
        let raw = await response.text();
        if (sanitize && typeof this.sanitize === "function") {
          raw = this.sanitize(raw);
        }
        return raw;
      } else {
        console.warn(`SVG fetch failed for "${src}": ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.warn(`SVG fetch failed for "${src}":`, error);
      return null;
    }
  }
  //MARK: resolveSource
  static resolveSource(src, base) {
    if (src == null) return null;
    const Src = new URL(src, document.baseURI);
    if (!base || base === "/" || URL.canParse(src)) return {
      resolved: Src,
      parts: {
        origin: Src.origin,
        basePath: "",
        srcPath: Src.pathname,
        search: Src.search,
        hash: Src.hash
      }
    };
    const Base = new URL(base, document.baseURI);
    const basePath = Base.pathname.replace(/\/+$/, "");
    const srcPath = Src.pathname.replace(/^\/+/, "");
    return {
      resolved: new URL(`${basePath}/${srcPath}${Src.search}${Src.hash}`, Base.origin),
      parts: {
        origin: Base.origin,
        basePath,
        srcPath: "/" + srcPath,
        search: Src.search,
        hash: Src.hash
      }
    };
  }
  //MARK: loading
  get loading() {
    const { EAGER, LAZY, DEFER, IDLE } = this.constructor.LOADING;
    const value = (this.getAttribute("loading") ?? "").trim().toLowerCase();
    if (value === EAGER || value === LAZY || value === DEFER || value === IDLE) {
      return value;
    }
    return this.constructor.defaults.loading;
  }
  set loading(value) {
    const { EAGER, LAZY, DEFER, IDLE } = this.constructor.LOADING;
    if (value == null) {
      this.removeAttribute("loading");
      return;
    }
    value = String(value).trim().toLowerCase();
    if (value === EAGER || value === LAZY || value === DEFER || value === IDLE) {
      this.setAttribute("loading", value);
    } else {
      console.warn(`Invalid loading value: "${value}". Valid values are: "${EAGER}", "${LAZY}", "${DEFER}", "${IDLE}".`);
    }
  }
  //MARK: set string attribute with validation
  #setStringAttribute(name, value, validate = () => true) {
    if (value == null) {
      this.removeAttribute(name);
      return;
    }
    value = String(value).trim();
    try {
      if (validate(value)) {
        this.setAttribute(name, value);
      }
    } catch (error) {
      console.warn(`Invalid value for attribute "${name}": "${value}".`, error);
    }
  }
  //MARK: src
  get src() {
    return this.getAttribute("src");
  }
  set src(value) {
    this.#setStringAttribute("src", value);
  }
  //MARK: src
  get srcset() {
    return this.getAttribute("srcset");
  }
  set srcset(value) {
    this.#setStringAttribute("srcset", value);
  }
  //MARK: sources
  get sources() {
    const result = {
      src: null,
      srcset: []
    };
    if (this.src) {
      result.src = {
        raw: this.src,
        resolved: this.constructor.resolveSource(this.src, this.base).resolved
      };
    }
    if (this.srcset) {
      result.srcset = this.srcset.split(",").map((candidate) => {
        candidate = candidate.trim();
        try {
          const lastSpace = candidate.lastIndexOf(" ");
          const descriptor = lastSpace !== -1 ? candidate.slice(lastSpace + 1) : null;
          let url, width = 0;
          if (descriptor?.endsWith("w")) {
            url = candidate.slice(0, lastSpace).trim();
            width = Number(descriptor.slice(0, -1));
          } else {
            url = candidate.trim();
            width;
          }
          return {
            raw: url,
            resolved: this.constructor.resolveSource(url, this.base).resolved,
            width
          };
        } catch (error) {
          return null;
        }
      }).filter((c) => c !== null);
    }
    return result;
  }
  //MARK: sanitize
  get sanitize() {
    return this.hasAttribute("sanitize");
  }
  set sanitize(value) {
    this.toggleAttribute("sanitize", value != null && value !== false);
  }
  //MARK: useCache
  get useCache() {
    return this.constructor.CACHE_ENABLED && !this.hasAttribute("no-cache");
  }
  set useCache(value) {
    this.toggleAttribute("no-cache", value != null && value !== true && this.constructor.CACHE_ENABLED);
  }
  //MARK: responsive
  get responsive() {
    return this.hasAttribute("responsive");
  }
  set responsive(value) {
    this.toggleAttribute("responsive", value != null && value !== false);
  }
  //MARK: lazyMargin
  get lazyMargin() {
    return this.getAttribute("lazy-margin") ?? this.constructor.defaults.lazyMargin;
  }
  set lazyMargin(value) {
    this.#setStringAttribute("lazy-margin", value, (v) => {
      if (!CSS.supports("margin", value)) {
        console.warn(`Invalid lazy-margin value: "${value}". It must be a valid CSS length.`);
        return false;
      }
      return true;
    });
  }
  //MARK: lazyThreshold
  get lazyThreshold() {
    const defaultValue = this.constructor.defaults.lazyThreshold;
    const value = Number(this.getAttribute("lazy-threshold") ?? defaultValue);
    return Number.isNaN(value) ? defaultValue : value;
  }
  set lazyThreshold(value) {
    if (value == null) {
      this.removeAttribute("lazy-threshold");
      return;
    }
    value = Number(value);
    if (Number.isNaN(value)) {
      console.warn(`Invalid lazy-threshold value: "${value}". It must be a number.`);
      return;
    }
    this.setAttribute("lazy-threshold", value);
  }
  set base(value) {
    if (value == null) {
      this.removeAttribute("base");
      return;
    }
    this.setAttribute("base", String(value));
  }
  get base() {
    return this.getAttribute("base") ?? this.constructor.defaults.base;
  }
  //MARK: exposeSVG
  get exposeSVG() {
    if (!this.hasAttribute("expose-svg")) return null;
    return this.getAttribute("expose-svg") || "svg";
  }
  set exposeSVG(value) {
    if (value == null || value === false) {
      this.removeAttribute("expose-svg");
      return;
    }
    this.setAttribute("expose-svg", value === true ? "" : String(value));
  }
  get width() {
    return this.getAttribute("width");
  }
  set width(value) {
    this.#setStringAttribute("width", value, (v) => {
      if (!CSS.supports("width", value)) {
        console.warn(`Invalid width value: "${value}". It must be a valid CSS length.`);
        return false;
      }
      return true;
    });
  }
  get height() {
    return this.getAttribute("height");
  }
  set height(value) {
    this.#setStringAttribute("height", value, (v) => {
      if (!CSS.supports("height", value)) {
        console.warn(`Invalid height value: "${value}". It must be a valid CSS length.`);
        return false;
      }
      return true;
    });
  }
  //MARK: SVG Attributes
  get preserveAspectRatio() {
    return this.getAttribute("preserveAspectRatio");
  }
  set preserveAspectRatio(value) {
    this.#setStringAttribute("preserveAspectRatio", value);
  }
  get viewBox() {
    return this.getAttribute("viewBox");
  }
  set viewBox(value) {
    this.#setStringAttribute("viewBox", value);
  }
};
var SVGIsolateBase_default = SVGIsolateBase;

// src/SVGIsolate.js
var SVGIsolate = class extends SVGIsolateBase_default {
  static observedAttributes = ["src", "srcset", "preserveAspectRatio", "viewBox", "width", "height"];
  static RESIZE_DEBOUNCE = 100;
  #connected = false;
  constructor() {
    super();
    const defaults = this.constructor.defaults;
    if (defaults.responsive) this.responsive = true;
    if (!defaults.useCache) this.useCache = false;
    if (defaults.sanitize) this.sanitize = true;
    if (defaults.exposeSVG) this.exposeSVG = defaults.exposeSVG;
    if (this.width) this.style.width = this.width;
    if (this.height) this.style.height = this.height;
    this.attachShadow({ mode: "open" });
    this.componentStyles = new ComponentStyles(this, this.constructor.styleSheets);
    this.componentStyles.apply();
  }
  connectedCallback() {
    this.#loadSource();
    this.#connected = true;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.#connected || oldValue === newValue) return;
    switch (name) {
      // srcset takes priority over src — handled by ResizeObserver
      case "srcset":
      case "src":
        this.#loadSource();
        break;
      // These attributes don't trigger a reload, but if an SVG is already rendered, update it
      case "preserveAspectRatio":
      case "viewBox":
        return this.#updateSVG(name);
      case "width":
      case "height":
        this[name] ? this.style[name] = this[name] : this.style.removeProperty(name);
        break;
    }
  }
  disconnectedCallback() {
    this.#connected = false;
    this.clear();
  }
  #updateSVG(name) {
    const svg = this.shadowRoot.querySelector("svg");
    const value = this[name];
    if (!svg || !value) return;
    switch (name) {
      case "viewBox":
      case "preserveAspectRatio":
        svg.setAttribute(name, value);
        break;
    }
  }
  //MARK: Rendering
  #renderSVG(svg) {
    if (typeof svg === "string") {
      const parser = new DOMParser();
      svg = parser.parseFromString(svg, "image/svg+xml").querySelector("svg");
    }
    if (this.exposeSVG) svg.setAttribute("part", this.exposeSVG);
    if (this.preserveAspectRatio) svg.setAttribute("preserveAspectRatio", this.preserveAspectRatio);
    if (this.viewBox) svg.setAttribute("viewBox", this.viewBox);
    const previousSVG = this.shadowRoot.querySelector("svg");
    if (previousSVG) {
      this.shadowRoot.querySelector("svg").replaceWith(svg);
    } else {
      this.shadowRoot.append(svg);
    }
  }
  renderSVG(svg) {
    this.clear();
    [
      "src",
      "srcset",
      "no-cache",
      "responsive",
      "loading",
      "lazy-margin",
      "lazy-threshold",
      "base"
    ].forEach((attr) => this.removeAttribute(attr));
    this.#renderSVG(svg);
    this.setAttribute("ready", "");
    this.dispatchEvent(new CustomEvent("ready"));
  }
  //MARK: Loading
  #currentSource = null;
  get currentSource() {
    return this.#currentSource;
  }
  async #loadSVG(src) {
    const { resolved } = this.constructor.resolveSource(src, this.base);
    this.setAttribute("fetching", "");
    this.dispatchEvent(new CustomEvent("fetching", {
      detail: { src, resolved }
    }));
    try {
      let rawSvg = this.useCache ? await this.constructor.CACHE.fetchSVG(resolved.href) : await this.constructor.fetchSVG(resolved.href);
      if (!rawSvg) return;
      if (this.sanitize && typeof this.constructor.sanitize === "function") {
        rawSvg = this.constructor.sanitize(rawSvg);
      }
      this.#renderSVG(rawSvg);
      this.#currentSource = { raw: src, resolved };
      this.setAttribute("ready", "");
      this.dispatchEvent(new CustomEvent("ready"));
    } catch (error) {
      console.warn(`SVG load failed for "${src}":`, error);
    } finally {
      this.removeAttribute("fetching");
    }
  }
  loadSVG(src, opt = {}) {
    if (!src) {
      console.warn(`SVG load failed: No source provided.`);
      return;
    }
    const { base, useCache } = opt;
    if (base != null) this.base = base;
    if (useCache != null) this.useCache = useCache;
    this.src = src;
  }
  #loadSource() {
    if (this.#connected) this.clear();
    switch (true) {
      case this.srcset != null:
        this.#watchSrcset();
        break;
      case this.src != null:
        this.#loadByStrategy({ src: this.src });
        break;
      default:
        const svg = this.querySelector("svg");
        if (svg) this.shadowRoot.append(svg);
        this.dispatchEvent(new CustomEvent("ready"));
        this.setAttribute("ready", "");
    }
  }
  //MARK: Loading Strategies
  #eagerLoad(src) {
    this.#loadSVG(src);
  }
  #deferLoad(src) {
    if (document.readyState !== "loading") this.#loadSVG(src);
    else {
      window.addEventListener("DOMContentLoaded", () => this.#loadSVG(src), { once: true });
    }
  }
  #idleLoad(src) {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => this.#loadSVG(src));
    } else {
      console.warn(`requestIdleCallback is not supported in this browser. Use "defer" loading strategy instead.`);
      this.#deferLoad(src);
    }
  }
  /**
   * Lazy loading strategy using IntersectionObserver.
   * Receives a source reference object instead of a plain string so that
   * if the component is resized before entering the viewport, the most
   * recently resolved candidate is loaded — not the one captured at setup time.
   * @param {{ src: string }} ref - Shared source reference
   */
  #lazyLoad(ref) {
    if (this.observers.has("lazy")) return;
    const { lazyThreshold, lazyMargin } = this;
    const observer = new IntersectionObserver((entries, observer2) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        this.#loadSVG(ref.src);
        observer2.disconnect();
        this.observers.delete("lazy");
      }
    }, {
      root: null,
      threshold: lazyThreshold,
      rootMargin: lazyMargin
    });
    observer.observe(this);
    this.observers.set("lazy", observer);
  }
  #loadByStrategy(ref) {
    const { EAGER, DEFER, IDLE, LAZY } = this.constructor.LOADING;
    switch (this.loading) {
      case EAGER:
        this.#eagerLoad(ref.src);
        break;
      case DEFER:
        this.#deferLoad(ref.src);
        break;
      case IDLE:
        this.#idleLoad(ref.src);
        break;
      case LAZY:
        this.#lazyLoad(ref);
        break;
      default:
        console.warn(`Unknown loading strategy "${this.loading}". Falling back to "eager".`);
        this.#eagerLoad(ref.src);
    }
  }
  //MARK: Srcset and Responsive management
  /**
   * Selects the most appropriate source candidate for a given display width.
   *
   * Picks the smallest candidate whose intrinsic width covers the requested width.
   * If no candidate is large enough, returns the largest available as a fallback.
   *
   * @template {{ width: number }} T
   * @param {T[]} candidates - Parsed srcset candidates
   * @param {number} width - The current display width in pixels
   * @returns {T | null} The best matching candidate, or null if none
   */
  static matchSource(candidates = [], width) {
    if (candidates.length === 0) return null;
    const sorted = candidates.toSorted((a, b) => a.width - b.width);
    const covering = sorted.filter((c) => c.width >= width);
    if (covering.length) return covering[0];
    return sorted.at(-1);
  }
  #watchSrcset() {
    const ref = { src: null };
    const onResize = (width) => {
      const source = this.constructor.matchSource(this.sources.srcset, width);
      if (source && ref.src !== source.raw) {
        ref.src = source.raw;
        this.#loadByStrategy(ref);
      }
      if (!this.responsive) {
        this.observers.get("resize").disconnect();
        this.observers.delete("resize");
      }
    };
    let timeout;
    const debounceTime = this.constructor.RESIZE_DEBOUNCE ?? 100;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => onResize(width), debounceTime);
      }
    });
    this.observers.set("resize", observer);
    observer.observe(this);
  }
  /**
   * Disconnects all active observers, removes the rendered SVG,
   * and resets the component to its unloaded state.
   * Called internally before every new load to ensure a clean slate.
   */
  clear() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    const svg = this.shadowRoot.querySelector("svg");
    if (svg) svg.remove();
    this.#currentSource = null;
    this.removeAttribute("ready");
  }
};
var SVGIsolate_default = SVGIsolate;

// raw-file:C:\Users\1812\Documents\PROGRAMACION\@components-1812\SVGIsolate\src\SVGIsolate.css
var SVGIsolate_default2 = ":host{position:relative;display:inline-block;margin:0;padding:0;width:100%;height:100%;contain:size;overflow:hidden}:host svg{display:block;width:100%;height:100%}";

// src/index.js
var SVGIsolateCSS = new CSSStyleSheet();
SVGIsolateCSS.replaceSync(SVGIsolate_default2);
SVGIsolate_default.define(null, { adopted: [SVGIsolateCSS] });
var index_default = SVGIsolate_default;
export {
  SVGIsolateCSS,
  SVGIsolate_default2 as SVGIsolateRawCSS,
  index_default as default
};
