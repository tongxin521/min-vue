import { isObject } from "@vue/shared";
import { mutableHandler, shallowReactiveHandlers } from "./baseHandlers";

const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();

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

function createReactiveObject(target, isReadonly, baseHandlers, proxyMap) {
    if (!isObject(target)) {
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
