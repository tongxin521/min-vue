import { isObject } from "@vue/shared"
import { isReactive, reactive } from "./reactive"
import { activeEffect, trackEffect, triggerEffect } from "./effect"
import { createDep } from "./dep"

export function ref(rawValue) {
    return new RefImpl(rawValue)
}

class RefImpl {
    private _value
    private _rawValue
    public readonly ___v_isRef = true
    public dep
    constructor(rawValue) {
        this._rawValue = rawValue
        this._value = isObject(rawValue) ? reactive(rawValue) : rawValue
    }

    get value() {
        trackRefValue(this)
        return this._value
    }

    set value(newVal) {
        if (newVal !== this._rawValue) {
            this._rawValue = newVal
            this._value = newVal
            triggerRefValue(this)
        }
    }
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

export function unref<T>(ref): T {
    return isRef(ref) ? ref.value : ref
  }


