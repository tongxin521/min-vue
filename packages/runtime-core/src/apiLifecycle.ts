import { currentInstance } from "./component";
import { LifecycleHooks } from "./enums";
export { onActivated, onDeactivated } from './components/KeepAlive'



const createHook = lifecycle => (hooks, target = currentInstance) => injectHook(lifecycle, (...args) => hooks(...args), target);

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

export function injectHook(type, hook, target = currentInstance, prepend = false) {
    if (target) {
        const hooks = target[type] || (target[type] = []);
        if (prepend) {
            hooks.unshift(hook);
        }
        else {
            hooks.push(hook);
        }
        return hook;
    }
}