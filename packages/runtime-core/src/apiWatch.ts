import { ReactiveEffect, isReactive, isRef } from "@vue/reactivity";
import { EMPTY_OBJ, NOOP, extend, hasChanged, isArray, isFunction, isMap, isObject, isPlainObject, isSet } from "@vue/shared";
import { ReactiveFlags } from "packages/reactivity/src/constants";
import { queueJob } from "./scheduler";
import { queuePostRenderEffect } from "./renderer";

let INITIAL_WATCHER_VALUE = {};

export function watch(source, cb, options) {

    return doWatch(source, cb, options);
}

export function watchEffect(effect, options) {
    return doWatch(effect, null, options);
}

export function watchPostEffect(effect, options) {
    return doWatch(effect, null, extend({}, options, { flush: 'post' }));
}


function doWatch(source, cb, {
    immediate,
    deep,
    flush,
    once,
    onTrack,
    onTrigger,
}: any = EMPTY_OBJ) {

    if (once && cb) {
        const _cb = cb;
        cb = (...args) => {
            _cb(...args);
            unwatch();
        }
    }

    const reactiveGetter = source => deep === true ? source : traverse(source, deep === false ? 1 : undefined)
    let getter;
    let isMultiSource = false;

    if (isRef(source)) {
        getter = () => source.value;
    }
    else if (isReactive(source)) {
        getter = () => reactiveGetter(source);
    }
    else if (isArray(source)) {
        isMultiSource = true;
        getter = () => source.map(s => {
            if (isRef(s)) {
                return s.value;
            }
            else if (isReactive(s)) {
                return reactiveGetter(s);
            }
            else if (isFunction(s)) {
                return s();
            } 
        });
    }
    else if (isFunction(source)) {
        if (cb) {
            getter = () => source();
        }
        else {
            getter = () => {
                if (cleanup) {
                    cleanup();
                }
                return source(onCleanup);
            }
        }
    }
    else {
        getter = NOOP;
    }

    if (cb && deep) {
        const baseGetter = getter;
        getter = () => traverse(baseGetter);
    }

    let cleanup = null;
    const onCleanup = (fn) => {
        cleanup = effect.stop = () => {
            fn();
            cleanup = effect.stop = null;
        }
    }

    let oldValue = isMultiSource
        ? new Array(source.length).fill(INITIAL_WATCHER_VALUE)
        : INITIAL_WATCHER_VALUE;

    const job = () => {
        if (!effect.active || !effect.dirty) {
            return;
        }

        if (cb) {
            const newVal = effect.run();

            if (
                isMultiSource
                ? newVal.some((v, i) => hasChanged(v, oldValue[i]))
                : hasChanged(newVal, oldValue)
            ) {
                if (cleanup) {
                    cleanup();
                }

                cb(
                    newVal,
                    oldValue === INITIAL_WATCHER_VALUE
                    ? undefined
                    : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE
                        ? []
                        : oldValue,
                    onCleanup
                );
            }

            oldValue = newVal;

        }
        else {
            // watchEffect
            effect.run();
        }
    }

    let scheduler = () => job();

    if (flush === 'sync') {
        scheduler = () => job();
    }
    else if (flush === 'post') {
        scheduler = () => queuePostRenderEffect(job);
    }
    else {
        // default: 'pre'
        scheduler = () => queueJob(job);
    }

    const effect = new ReactiveEffect(getter, NOOP, scheduler);

    const unwatch = () => {
        effect.stop();
    }

    effect.onTrack = onTrack;
    effect.onTrigger = onTrigger;

    if (cb) {
        if (immediate) {
            job();
        }
        else {
            oldValue = effect.run();
        }
        
    }
    else {
        effect.run();
    }

    return unwatch;

}


function traverse(value, depth = Infinity, seen?) {
    if (depth <= 0 || !isObject(value) || value[ReactiveFlags.SKIP]) {
        return value;
    }

    seen = seen || new Set();

    if (seen.has(value)) {
        return value;
    }

    seen.add(value);

    depth--;

    if (isRef(value)) {
        traverse(value.value, depth, seen);
    }
    else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            traverse(value[i], depth, seen);
        }
    }
    else if (isSet(value) || isMap(value)) {
        value.forEach((v) => {
            traverse(v, depth, seen);
        });
    }
    else if (isPlainObject(value)) {
        for (const key in value) {
            traverse(value[key], depth, seen);
        }

        for (const key of Object.getOwnPropertySymbols(value)) {
            traverse(value[key], depth, seen);
        }
    }

    return value;

}
