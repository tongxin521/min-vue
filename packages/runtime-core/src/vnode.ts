import { isArray, isString } from "@vue/shared"
import { ShapeFlags } from "packages/shared/src/shapeFlags"

export function createVNode(type, props, children = null) {
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
    const vnode = {
        // 标记为vnode
        __v_isVNode: true,
        // vnode类型
        type,
        // 属性
        props,
        // 子节点
        children,
        // key
        key: props?.key || null,
        // 元素
        el: null,
        shapeFlag,
    }

    normalizeChildren(vnode, children);

    return vnode
}


export function isVNode(vnode) {
    return vnode.__v_isVNode === true
}


function normalizeChildren(vnode, children) {
    let type= null;
    const {shapeFlag} = vnode;
    if (children == null) {
        children = null;
    }
    else if (isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN;
    }
    else {
        type = ShapeFlags.TEXT_CHILDREN;
        children = String(children);
        vnode.children = children;
        vnode.shapeFlag |= type;
    }
}