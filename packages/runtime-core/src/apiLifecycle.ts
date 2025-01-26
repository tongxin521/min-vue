import { currentInstance } from "./component";
import { LifecycleHooks } from "./enums";



const createHook = lifecycle => (hooks, target) => injectHook(lifecycle, (...args) => hooks(...args), target);

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

export function injectHook(type, hook, target = currentInstance) {
    if (target) {
        const hooks = target[type] || (target[type] = []);
        hooks.push(hook);
        return hook;
    }
}