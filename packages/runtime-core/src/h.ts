import { isArray, isObject } from "@vue/shared";
import { createVNode, isVNode } from "./vnode";
/**
 * h 可以寄接受 1 ～ Infinity 个参数
 * 2 个参数时，第一个参数是类型，第二个参数是 props 或者 children
 *  + 如果第二个参数是 vnode，则第二个参数是 children
 *  + 如果第二个参数是数组，则第二个参数是 children
 *  + 如果第二个参数是 object 且不是 vnode，则第二个参数是 props
 * 3 个参数时，第一个参数是类型，第二个参数是 props，第三个参数是 children
 * 多个参数时，第一个参数是类型，第二个参数是 props，剩余参数是 children
 */

export function h(type, propsOrChildren, children) {
    const l = arguments.length;

    if (l === 2) {
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            if (isVNode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren]);
            }
            return createVNode(type, propsOrChildren);
        }
        else {
            return createVNode(type, null, propsOrChildren);
        }
        
    }

    else {
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2);
        }
        else if (l === 3 && isVNode(children)) {
            children = [children];
        }

        return createVNode(type, propsOrChildren, children);
    }

}