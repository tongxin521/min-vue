import { currentInstance } from "./component";
import { LifecycleHooks } from "./enums";



const createHook = lifecycle => (hooks, target) => injectHook(lifecycle, (...args) => hooks(...args), target);

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);

export function injectHook(type, hook, target = currentInstance) {
    if (target) {
        const hooks = target[type] || (target[type] = []);
        hooks.push(hook);
        return hook;
    }
}