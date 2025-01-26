import { EMPTY_OBJ, extend, hasOwn, hyphenate, isArray, isFunction, isOn } from "@vue/shared";

export function normalizeEmitsOptions(comp, appContext) {
    const raws = comp.emits;
    let normalized = {};

    if (isArray(raws)) {
        raws.forEach(key => {
            normalized[key] = null;
        });
    }
    else {
        extend(normalized, raws)
    }

    return normalized;
}


export function isEmitListener(options, key) {
    if (!options || !isOn(key)) {
        return false;
    }

    key = key.slice(2).replace(/Once$/, '')

    return (
        // 检查 options 对象中是否存在小写首字母的 key 值
        hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
        // 检查 options 对象中是否存在连字符形式的 key 值
        hasOwn(options, hyphenate(key)) ||
        // 检查 options 对象中是否存在原始 key 值
        hasOwn(options, key)
      );
}

export function emit(instance, event, ...rawArgs) {
    if (instance.isUnmounted) return

    const props = instance.vnode.props || EMPTY_OBJ;

    let args = rawArgs;

    const handlerName = `on${event[0].toUpperCase() + event.slice(1)}`;

    let handle = props[handlerName];


    if (handle) {
        if (isFunction(handle)) {
            handle(...args)
        }
        if (isArray(handle)) {
            for (let i = 0; i < handle.length; i++) {
                handle[i](...args)
            }
        }
    }
}