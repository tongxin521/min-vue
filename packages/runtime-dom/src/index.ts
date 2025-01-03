import { createRenderer, h } from "@vue/runtime-core";
import { patchProp } from "./patchProp";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";

export {ref, reactive} from '@vue/reactivity'


export const rendererOptions = extend({patchProp}, nodeOps);

export function render(...args: [any, any]) {
    createRenderer(rendererOptions).render(...args);
}

export {h}