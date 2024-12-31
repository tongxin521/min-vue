import { ShapeFlags } from "@vue/shared";
import { normalizeVNode } from "./vnode";

export function renderComponentRoot(instance) {
    const {vnode, proxy, type} = instance;

    let result;
    try {
        if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            result = normalizeVNode(type.render.call(proxy));
            
        }
    } catch (error) {
        
    }
    return result;
}