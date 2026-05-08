import SVGIsolate from './SVGIsolate.js';
import SVGIsolateRawCSS from './SVGIsolate.css?raw';

//Add the stylesheets to the component
const SVGIsolateCSS = new CSSStyleSheet();
SVGIsolateCSS.replaceSync(SVGIsolateRawCSS);

SVGIsolate.define(null, { adopted: [SVGIsolateCSS] });


export { SVGIsolateRawCSS, SVGIsolateCSS };
export default SVGIsolate;
