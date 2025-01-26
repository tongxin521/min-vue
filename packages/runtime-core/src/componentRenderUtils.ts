import { ShapeFlags } from "@vue/shared";
import { normalizeVNode } from "./vnode";
import { isEmitListener } from "./componentEmits";

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

function hasPropsChanged(prevProps, nextProps, emitsOptions) {
    const nextKeys = Object.keys(nextProps)
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }

    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key] && !isEmitListener(emitsOptions, key)) {
            return true;
        }
    }
    return false;
}

export function shouldUpdateComponent(prevVNode, nextVNode) {
    const {props: prevProps, children: prevChildren, component} = prevVNode;
    const {props: nextProps, children: nextChildren} = nextVNode;
    const emits = component.emitsOptions

    if (prevChildren || nextChildren) {
        if (!nextChildren) {
            return true;
        }
    }

    if (prevProps === nextProps) {
        return false;
    }

    if (!prevProps) {
        return true;
    }

    if (!nextProps) {
        return true;
    }

    return hasPropsChanged(prevProps, nextProps, emits)

}