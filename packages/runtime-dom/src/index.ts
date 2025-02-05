import { createRenderer, h } from "@vue/runtime-core";
import { patchProp } from "./patchProp";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";

import {
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted,
    provide,
    inject,
    useSlots,
    useAttrs,
} from "@vue/runtime-core";

export {
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted,
    provide,
    inject,
    useSlots,
    useAttrs,
}

export {ref, reactive} from '@vue/reactivity'


export const rendererOptions = extend({patchProp}, nodeOps);

export function render(...args: [any, any]) {
    createRenderer(rendererOptions).render(...args);
}

export {h}