import { hasChanged, isArray, isFunction, isObject } from "@vue/shared"
import { isReactive, isReadonly, isShallow, toRaw, toReactive } from "./reactive"
import { activeEffect, trackEffect, triggerEffect } from "./effect"
import { createDep } from "./dep"
import { getDepFromReactive } from "./reactiveEffect"

export function ref(rawValue?) {
    return createRef(rawValue, false)
}

export function shallowRef(rawValue?) {
    return createRef(rawValue, true)
}

export function unref<T>(ref): T {
    return isRef(ref) ? ref.value : ref
}

export function toValue(source) {
    return isFunction(source) ? source() : source
}

export function toRefs(object) {
    const ret = isArray(object) ? new Array(object.length) : {}

    for (const key in object) {
        ret[key] = propertyToRef(object, key)
    }

    return ret
}

export function toRef(source, key, defaultValue) {
    if (isRef(source)) {
        return source;
    }
    else if (isFunction(source)) {
        return new GetterRefImpl(source);
    }
    else if (isObject(source) && arguments.length > 1) {
        return propertyToRef(source, key, defaultValue);
    }
    else {
        return ref(source);
    }
}

class RefImpl {
    private _value
    private _rawValue
    public readonly ___v_isRef = true
    public dep
    constructor(value, public readonly __v_isShallow) {
        this._rawValue = __v_isShallow ? value : toRaw(value)
        this._value = __v_isShallow ? value : toReactive(value)
    }

    get value() {
        trackRefValue(this)
        return this._value
    }

    set value(newVal) {
        const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
        newVal = useDirectValue ? newVal : toRaw(newVal)
        if (hasChanged(newVal, this._rawValue)) {
            this._rawValue = newVal
            this._value = useDirectValue ? newVal : toReactive(newVal)
            triggerRefValue(this)
        }
    }
}

function createRef(rawValue, shallow) {
    if (isRef(rawValue)) {
        return rawValue
    }

    return new RefImpl(rawValue, shallow)

}


export function trackRefValue(ref) {
    if (activeEffect) {
        trackEffect(activeEffect ,ref.dep || (ref.dep = createDep(() => ref.dep = undefined)))
    }
}


export function triggerRefValue(ref) {
    const dep = ref.dep;
    if (dep) {
        triggerEffect(dep);
    }
}


export function isRef(r) {
    return !!(r && r.___v_isRef === true)
}


export function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

const shallowUnwrapHandlers = {
    get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
    set: (target, key, value, receiver) => {
      const oldValue = target[key]
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      } else {
        return Reflect.set(target, key, value, receiver)
      }
    },
}



function propertyToRef(source, key, defaultValue?) {
    const val = source[key]
    return isRef(val) ? val : new ObjectRefImpl(source, key, defaultValue)
}


class ObjectRefImpl {
    public readonly __v_isRef = true
    constructor(
        private readonly _object,
        private readonly _key,
        private readonly _defaultValue?,
    ) {}

    get value() {
        const val = this._object[this._key]
        return val === undefined ? this._defaultValue : val
    }

    set value(newVal) {
        this._object[this._key] = newVal
    }

    get dep() {
        return getDepFromReactive(toRaw(this._object), this._key)
    }
}

class GetterRefImpl<T> {
    public readonly __v_isRef = true
    public readonly __v_isReadonly = true
    constructor(private readonly _getter: () => T) {}
    get value() {
      return this._getter()
    }
  }

