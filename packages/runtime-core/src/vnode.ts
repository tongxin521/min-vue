import { isArray, isFunction, isObject, isString } from "@vue/shared"
import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { currentRenderingInstance } from "./componentRenderContext";

export const Text = Symbol.for('v-text');
export const Fragment = Symbol.for('v-fgt')

export function createVNode(type, props, children = null) {
    const shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT
        : isObject(type)
        ? ShapeFlags.STATEFUL_COMPONENT
        : isFunction(type)
        ? ShapeFlags.FUNCTIONAL_COMPONENT
        : 0;
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
        // 组件实例
        component: null,
        // 当前渲染的组件实例
        ctx: currentRenderingInstance,
    }

    normalizeChildren(vnode, children);

    return vnode
}


export function isVNode(vnode) {
    return vnode.__v_isVNode === true
}


function normalizeChildren(vnode, children) {
    let type = 0;
    const {shapeFlag} = vnode;
    if (children == null) {
        children = null;
    }
    else if (isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN;
    }
    else if (typeof children === 'object') {
       if (shapeFlag & ShapeFlags.ELEMENT) {
        const slot = children.default;
        
        if (slot) {
            normalizeChildren(vnode, slot());
        }
        return;
       }
       else {
        type = ShapeFlags.SLOTS_CHILDREN;
       }
    }
    else if (isFunction(children)) {
        children = {
            default: children,
            _ctx: currentRenderingInstance,
        };
        type = ShapeFlags.SLOTS_CHILDREN;
    }
    else {
        type = ShapeFlags.TEXT_CHILDREN;
        children = String(children);
    }
    vnode.children = children;
        vnode.shapeFlag |= type;
}

export function isSameNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
}

/**
 * 如果子节点 vnode ，直接返回
 * 如果子节点是文本，则转为 Text vnode 返回
 * 如果子节点是数组，则转为 Fragment vnode 返回
 * @param child 
 * @returns 
 */
export function normalizeVNode(child) {
    if (isArray(child)) {
        return createVNode(Fragment, null, child);
    }
    else if (isObject(child)) {
        if (isVNode(child)) {
            return child;
        }
        return child;
    }
    else {
        return createVNode(Text, null, String(child));
    }
    
}