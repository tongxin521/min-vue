import { extend, isArray, isFunction, isObject, isOn, isString, normalizeClass, normalizeStyle } from "@vue/shared"
import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { currentRenderingInstance } from "./componentRenderContext";
import { isProxy, isRef } from "@vue/reactivity";
import { isInternalObject } from "./internalObject";

export const Text = Symbol.for('v-text');
export const Fragment = Symbol.for('v-fgt')

export function createVNode(type, props?, children = null) {
    if (isVNode(type)) {
        const cloned = cloneVNode(type);
        if (children) {
            normalizeChildren(cloned, children);
        }
        return cloned;
    }

    if (props) {
        props = guardReactiveProps(props);
        let {class: klass, style } = props;
        if (klass && !isString(klass)) {
            props.class = normalizeClass(klass);
        }

        if (isObject(style)) {
            if (isProxy(style) && !isArray(style)) {
                style = extend({}, style);
            }
            props.style = normalizeStyle(style);
        }
    }
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
        key: props && normalizeKey(props),
        ref: props && normalizeRef(props),
        // 元素
        el: null,
        shapeFlag,
        // 组件实例
        component: null,
        appContext: null,
        // 当前渲染的组件实例
        ctx: currentRenderingInstance,
    }

    normalizeChildren(vnode, children);

    return vnode
}

export const guardReactiveProps = (props) => {
    if (!props) return null;
    return isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
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

export function isSameVNodeType(n1, n2) {
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

function normalizeKey({key}) {
    return key != null ? key : null;
}

function normalizeRef({ref, ref_key, ref_for}) {
    if (typeof ref === 'boolean') {
        ref = ref + '';
    }
    return (ref !== null ?
        isString(ref) || isRef(ref) || isFunction(ref) ?
        { i: currentRenderingInstance, r: ref, k: ref_key, f: !!ref_for }
        : ref
        : null);
}


export function cloneVNode(vnode, extraProps?, mergeRef = false) {
    const {props, ref, children} = vnode;
    const mergedProps = extraProps ? mergeProps(props, extraProps) : props;

    const cloned = {
        ____v_isVNode: true,
        type: vnode.type,
        props: mergedProps,
        key: mergedProps && normalizeKey(mergedProps),
        ref: extraProps && extraProps.ref
        ? mergeRef && ref
          ? isArray(ref)
            ? ref.concat(normalizeRef(extraProps)!)
            : [ref, normalizeRef(extraProps)!]
          : normalizeRef(extraProps)
        : ref,
        children,
        shapeFlag: vnode.shapeFlag,
        component: vnode.component,
        appContext: vnode.appContext,
        el: vnode.el,
        ctx: vnode.ctx,
    }

    return cloned;
}

export function mergeProps(...args) {
    const ret: any = {};
    for (let i = 0; i < args.length; i++) {
        const toMerge = args[i];
        for (const key in toMerge) {
            if (key === 'class') {
                if (ret.class !== toMerge.class) {
                    ret.class = normalizeClass([ret.class, toMerge.class])
                }
            } else if (key === 'style') {
                ret.style = normalizeStyle([ret.style, toMerge.style]);
            }
            else if (isOn(key)) {
                const existing = ret[key];
                const incoming = toMerge[key];

                if (
                    incoming && existing !== incoming
                    && !(isArray(existing) && existing.includes(incoming))
                ) {
                    ret[key] = existing
                        ? [].concat(existing as any, incoming as any)
                        : incoming
                }

            }
            else if (key !== '') {
                ret[key] = toMerge[key]
            }
        }
    }
    return ret;
}