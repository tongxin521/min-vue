import { EMPTY_OBJ, ShapeFlags, isFunction, isObject } from "@vue/shared";
import { initProps, normalizePropsOptions } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { createAppContext } from "./apiCreateApp";
import { initSlots } from "./componentSlots";
import { applyOptions } from "./componentOptions";
import { track } from "@vue/reactivity";

const emptyAppContext = createAppContext()
let uid = 0;
export let currentInstance = null;
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
        // 组件暴露的属性，可以被其他组件引用
        exposed: null,
        // 自定义 props
        propsOptions: normalizePropsOptions(type, appContext),
        // 组件上下文（当前组件实例）
        ctx: EMPTY_OBJ,
        data: EMPTY_OBJ,
        props: EMPTY_OBJ,
        attrs: EMPTY_OBJ,
        slots: EMPTY_OBJ,
        setupState: EMPTY_OBJ,
        setupContext: null,
        // 组件渲染状态
        isMounted: false,
        // 生命周期
        bc: null,
        c: null,
        bm: null,
        m: null,
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

const attrsProxyHandlers = {
    get(target, key) {
        track(target, '');
        return target[key];
    }
}

function createSetupContext(instance) {
    const expose = exposed => {
        instance.exposed = exposed || {};
    }
    return {
        attrs: new Proxy(instance.attrs, attrsProxyHandlers),
        slots: instance.slots,
        emit: instance.emit,
        expose
    }
}

function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    } else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }

    finishComponentSetup(instance);
}

function setupStatefulComponent(instance) {
    const Component = instance.type;

    const {setup} = Component;

    

    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

    if (setup) {
        // 创建 setup 上下文
        const setupContext = (instance.setupContext = createSetupContext(instance));

        const reset = setCurrentInstance(instance);
        const setupResult = setup(instance.props ,setupContext);
        reset();

        handleSetupResult(instance, setupResult);
        
    } else {
        finishComponentSetup(instance);
    }

    
}


function finishComponentSetup(instance) {
    const Component = instance.type;

    if (!instance.render) {
        instance.render = Component.render;
    }

    // 这里可以处理组件的 option Api
    const reset = setCurrentInstance(instance)
    applyOptions(instance);
    reset();
}

function isStatefulComponent(instance) {
    return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}


function setCurrentInstance(instance) {
    const prev = currentInstance;
    currentInstance = instance;
    return () => {
        currentInstance = prev;
    }
}
