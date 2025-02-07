import { def, isObject } from "@vue/shared";
import { mutableHandler, shallowReactiveHandlers, readonlyHandlers } from "./baseHandlers";
import { ReactiveFlags } from "./constants";

export const reactiveMap = new WeakMap();
export const shallowReactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();

export function reactive(obj) {
    return createReactiveObject(
        obj,
        false,
        mutableHandler,
        reactiveMap
    );
}

export function shallowReactive(obj) {
    return createReactiveObject(
        obj,
        false,
        shallowReactiveHandlers,
        shallowReactiveMap
    );
}

export function readonly(obj) {
    return createReactiveObject(
        obj,
        true,
        readonlyHandlers,
        readonlyMap
    );
}

function createReactiveObject(target, isReadonly, baseHandlers, proxyMap) {
    if (!isObject(target)) {
        return target;
    }

    if (
        target[ReactiveFlags.RAW]
        && !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
    ) {
        return target;
    }

    const existingProxy = proxyMap.get(target);

    if (existingProxy) {
        return existingProxy;
    }

    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);

    return proxy;
}


export function toRaw(observed) {
    const raw = observed && observed[ReactiveFlags.RAW];
    return raw ? toRaw(raw) : observed;
}


export function isReactive(value) {
    if (isReadonly(value)) {
        return isReactive(value[ReactiveFlags.RAW]);
    }
    return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

export function isReadonly(value) {
    return !!(value && value[ReactiveFlags.IS_READONLY]);
}

export function isShallow(value) {
    return !!(value && value[ReactiveFlags.IS_SHALLOW]);
}

export function markRaw(value) {
    def(value, ReactiveFlags.SKIP, true)
    return value
}


export function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
}
