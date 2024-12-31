import { EMPTY_OBJ, extend, hasOwn, isArray, isFunction, isReservedProp } from "@vue/shared";
import { createInternalObject } from "./internalObject";
import { shallowReactive } from "@vue/reactivity";



export function initProps(instance, rawProps, isStateful) {
    const props = {};
    const attrs = createInternalObject();
    

    setFullProps(instance, rawProps, props, attrs)


    if (isStateful) {
        instance.props = shallowReactive(props);
    }

    instance.attrs = attrs;

}

function setFullProps(instance, rawProps, props, attrs) {
    const [options, needCastKeys] = instance.propsOptions;
    if (rawProps) {
        for (const key in rawProps) {
            if (isReservedProp(key)) {
                continue
            }

            const value = rawProps[key];
            
            if (options && hasOwn(options, key)) {
                props[key] = value;
            }
            else {
                attrs[key] = value;
            }
        }
    }
}


enum BooleanFlags {
    shouldCast,
    shouldCastTrue,
}

/**
 * 检查是否是保留属性
 * @param key 要验证的属性名
 * @returns true 表示不是保留属性，false 表示是保留属性
 */
function validatePropName(key: string) {
    // 检查属性名的第一个字符不是'$'，且不是保留属性
    if (key[0] !== '$' && !isReservedProp(key)) {
      // 返回true，表示属性名有效
      return true
    }
    // 返回false，表示属性名无效
    return false
  }

export function normalizePropsOptions(comp, appContext) {
    const raw = comp.props;
    const normalized = {};
    const needCastKeys = [];

    if (isArray(raw)) {
        for (let i = 0; i < raw.length; i++) {
            const key = raw[i];
            if (validatePropName(key)) {
                normalized[key] = EMPTY_OBJ;
            }
        }
    }
    else if (raw) {
        for (const key in raw) {
            if (validatePropName(key)) {
                const opt = raw[key];
                const prop = normalized[key] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
                const propType = prop.type;

                let shouldCast = false;
                let shouldCastTrue = true;
                if (isArray(propType)) {
                    for (let i = 0; i < propType.length; i++) {
                        const type = propType[i];
                        const typeName = isFunction(type) && type.name;

                        if (typeName === "Boolean") {
                            shouldCast = true;
                            break;
                        }
                        else if (typeName === "String") {
                            shouldCastTrue = false;
                        }
                    }
                }
                else {
                    shouldCast = isFunction(propType) && propType.name === "Boolean";
                }

                prop[BooleanFlags.shouldCast] = shouldCast;
                prop[BooleanFlags.shouldCastTrue] = shouldCastTrue;

                if (shouldCast || hasOwn(prop, 'default')) {
                    needCastKeys.push(key)
                }
            }
        }
    }

    const res = [normalized, needCastKeys];

    return res;

}