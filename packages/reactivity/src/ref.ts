import { isObject } from "@vue/shared"
import { reactive } from "./reactive"
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


function trackRefValue(ref) {
    if (activeEffect) {
        trackEffect(activeEffect ,ref.dep || (ref.dep = createDep(() => ref.dep = undefined)))
    }
}


function triggerRefValue(ref) {
    const dep = ref.dep;
    if (dep) {
        triggerEffect(dep);
    }
}


