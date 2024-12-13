import { createDep } from "./dep";
import { activeEffect, trackEffect, triggerEffect } from "./effect";

const targetMap = new WeakMap();

/**
 * 依赖存储结构
 * target -> depsMap -> key -> dep
 */
export function track(target, key) {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep(() => depsMap.delete(key))));
        }
        trackEffect(activeEffect, dep);
    }

}

export function trigger(target, key) {
    const depsMap = targetMap.get(target);

    if (!depsMap) {
        return
    }

    const dep = depsMap.get(key);
    triggerEffect(dep);
}

