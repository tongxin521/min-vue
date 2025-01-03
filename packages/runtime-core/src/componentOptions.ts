import { reactive } from "@vue/reactivity";
import { LifecycleHooks } from "./enums";
import { isArray } from "@vue/shared";
import { onBeforeMount, onMounted } from "./apiLifecycle";

export function applyOptions(instance) {
    const options = resolveMergedOptions(instance)
    const publicThis = instance.proxy;

    if (options.beforeCreate) {
        callHook(options.beforeCreate, instance, LifecycleHooks.BEFORE_CREATE)
    }

    const {
        data: dataOptions,
        created,
        beforeMount,
        mounted,
    } = options;

    if (dataOptions) {
        const data = dataOptions.call(publicThis);
        instance.data = reactive(data);
    }

    if (created) {
        callHook(created, instance, LifecycleHooks.CREATED)
    }

    function registerLifecycleHook(register, hook) {
        if (isArray(hook)) {
            hook.forEach(_hook => register(_hook.bind(publicThis)))
        }
        else if (hook) {
            register(hook.bind(publicThis))
        }
    }
    registerLifecycleHook(onBeforeMount, beforeMount)
    registerLifecycleHook(onMounted, mounted)
}

function resolveMergedOptions(instance) {
    // TODO: 这里可以处理 mixins, extends
    const base = instance.type;

    return base;

}

function callHook(hook, instance, type) {
    if (isArray(hook)) {
        hook.map(h => h.call(instance.proxy))
    }
    else {
        hook.call(instance.proxy);
    }
}