import { isOn } from "@vue/shared";
import { patchClass } from "./modules/class";
import { patchStyle } from "./modules/style";
import { patchEvent } from "./modules/events";
import { patchAttr } from "./modules/attrs";

export const patchProp = (el, key, preValue, nextValue) => {
    if (key === 'calss') {
        patchClass(el, nextValue);
    }
    else if (key === 'style') {
        patchStyle(el, preValue, nextValue);
    }
    else if (isOn(key)) {
        patchEvent(el, key, preValue, nextValue)
    }
    else {
        patchAttr(el, key, nextValue)
    }
}