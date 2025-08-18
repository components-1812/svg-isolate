import { SVGIsolate } from './SVGIsolate.js';

const TAG_NAME = 'custom-svg-isolate';

//Register the custom element
if(!customElements.get(TAG_NAME)){

    customElements.define(TAG_NAME, SVGIsolate);
}
else {

    console.warn(`Custom element "${TAG_NAME}" is already defined.`);
}

export { TAG_NAME, SVGIsolate };
export default SVGIsolate;
