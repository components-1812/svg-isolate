import { SVGIsolate } from './SVGIsolate.js';
import SVGIsolateRawCSS from './SVGIsolate.css?raw';

const TAG_NAME = 'custom-svg-isolate';

//Add the stylesheets to the component
const SVGIsolateCSS = new CSSStyleSheet();

SVGIsolateCSS.replaceSync(SVGIsolateRawCSS);

SVGIsolate.stylesSheets.adopted.push(SVGIsolateCSS);

//Register the custom element
if(!customElements.get(TAG_NAME)){

    customElements.define(TAG_NAME, SVGIsolate);
}
else {

    console.warn(`Custom element "${TAG_NAME}" is already defined.`);
}

export { TAG_NAME, SVGIsolate, SVGIsolateCSS };
export default SVGIsolate;
