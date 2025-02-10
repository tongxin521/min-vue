import { createRenderer, h } from "@vue/runtime-core";
import { patchProp } from "./patchProp";
import { extend, isFunction, isString } from "@vue/shared";
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
    defineAsyncComponent,
    nextTick,
    watch,
    watchEffect,
    watchPostEffect,
    watchSyncEffect,
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
    defineAsyncComponent,
    nextTick,
    watch,
    watchEffect,
    watchPostEffect,
    watchSyncEffect,
}

export {
    ref,
    reactive,
    isRef,
    toRef,
    toRefs,
    readonly,
    isReactive,
    isReadonly,
    shallowReactive,
    shallowReadonly,
    unref,
    computed,
    toRaw,
    markRaw,
    shallowRef,
    isProxy,
    customRef,
    triggerRef,
} from '@vue/reactivity'


export const rendererOptions = extend({patchProp}, nodeOps);

export function render(...args: [any, any]) {
    createRenderer(rendererOptions).render(...args);
}

export {h}

let renderer

function  ensureRenderer() {
    return renderer || (renderer = createRenderer(rendererOptions));
}

export function createApp(...args) {
    const app = ensureRenderer().createApp(...args);

    const { mount } = app;
    app.mount = function (containerOrSelector: any) {
        const container = normalizeContainer(containerOrSelector);
        const component = app._component;
        if (!container) {
            return;
        }
        if (!isFunction(component) && !component.render && !component.template) {
            component.template = container.innerHTML;
        }

        container.innerHTML = '';
        const proxy = mount(container, false)
        if (container instanceof Element) {
          container.removeAttribute('v-cloak')
          container.setAttribute('data-v-app', '')
        }
        return proxy;
    };

    return app;
}


function normalizeContainer(container) {
    if (isString(container)) {
        const res = document.querySelector(container);
        return res;
    }
    return container;
}