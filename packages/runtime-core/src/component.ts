import { EMPTY_OBJ, ShapeFlags, isFunction } from "@vue/shared";
import { initProps, normalizePropsOptions } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { reactive } from "@vue/reactivity";
import { createAppContext } from "./apiCreateApp";
import { initSlots } from "./componentSlots";

const emptyAppContext = createAppContext()
let uid = 0;
export function createComponentInstance(vnode) {
    const type = vnode.type;
    const appContext = emptyAppContext;

    const instance = {
        // 唯一标识
        uid: uid++,
        vnode,
        // 组件类型
        type,
        // 组件渲染的 ast 树
        subTree: null,
        // 组件状态代理
        proxy: null,
        // 自定义 props
        propsOptions: normalizePropsOptions(type, appContext),
        // 组件上下文（当前组件实例）
        ctx: EMPTY_OBJ,
        data: EMPTY_OBJ,
        props: EMPTY_OBJ,
        attrs: EMPTY_OBJ,
        slots: EMPTY_OBJ,
    }

    instance.ctx = {_: instance};

    return instance;
}

export function setupComponent(instance) {
    const {props, children} = instance.vnode;
    // 判断是否是状态组件
    const isStateful = isStatefulComponent(instance)

    initProps(instance, props, isStateful);
    initSlots(instance, children);

    const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;

    return setupResult;
}


function setupStatefulComponent(instance) {
    const Component = instance.type;

    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

    finishComponentSetup(instance);
}


function finishComponentSetup(instance) {
    const Component = instance.type;

    if (!instance.render) {
        instance.render = Component.render;
    }

    const {data: dataOptions} = Component;

    if (dataOptions) {
        const data = dataOptions.call(instance.proxy);
        instance.data = reactive(data);
    }
}

function isStatefulComponent(instance) {
    return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}
