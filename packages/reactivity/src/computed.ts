import { NOOP, isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export function computed(getterOrOptions) {
    let getter, setter;

    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = NOOP;
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

    return new ComputedRefImpl(getter, setter);
}


class ComputedRefImpl {
    public dep
    private _value;
    public readonly effect;
    public readonly __v_isRef = true;
    constructor(public getter, public readonly _setter) {
        this.effect = new ReactiveEffect(
            () => this.getter(this._value),
            NOOP,
            () => {
                triggerRefValue(this);
            })
    }

    get value() {
        if (this.effect.dirty) {
            this._value = this.effect.run();
            trackRefValue(this);
        }
        return this._value;
    }

    set value(val) {
        this._setter(val);
    }
}