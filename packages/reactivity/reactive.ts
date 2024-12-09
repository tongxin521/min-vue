import { isObject } from "../shared";
import { baseHandlers } from "./baseHandlers";

const reactiveMap = new WeakMap();

export function reactive(obj) {
    if (!isObject(obj)) {
        return obj;
    }

    const existingProxy = reactiveMap.get(obj);

    if (existingProxy) {
        return existingProxy;
    }

    const proxy = new Proxy(obj, baseHandlers);
    reactiveMap.set(obj, proxy);

    return proxy;


}