import { isFunction } from "@vue/shared";
import { defineComponent } from "./apiDefineComponent";
import { currentInstance } from "./component";
import { createVNode } from "./vnode";
import { ref } from "@vue/reactivity";

export const isAsyncWrapper = i => !!i.type.__asyncLoader;

export function defineAsyncComponent(source) {
    if (isFunction(source)) {
        source = {loader: source}
    }

    const {
        loader,
        loadingComponent,
        errorComponent,
        delay = 200,
        timeout,
        suspensible = true,
        onError: userOnError,
    } = source;

    let pendingRequest = null;
    let resolvedComp = null;

    let retries = 0;

    const retry = () => {
        retries++;
        pendingRequest = null;
        return load();
    }

    const load = () => {
        let thisRequest;
        return pendingRequest || (thisRequest = pendingRequest = loader()
        .catch(err => {
            err = err instanceof Error ? err : new Error(String(err));
            if (userOnError) {
                return new Promise((resolve, reject) => {
                    const userRetry = () => resolve(retry());
                    const userFail = () => reject(err);
                    userOnError(err, userRetry, userFail, retries + 1);
                })
            } else {
                throw err;
            }
        })
        .then((comp) => {
            if (thisRequest !== pendingRequest && pendingRequest) {
                return pendingRequest;
            }
            resolvedComp = comp;
            return comp;
        }))
    }

    return defineComponent({
        name: 'AsyncComponentWrapper',
        __asyncLoader: load,
        get __asyncResolved() {
            return resolvedComp
        },

        setup() {
            const instance = currentInstance
            if (resolvedComp) {
                return () => createInnerComp(resolvedComp, instance);
            }

            const onError = (err) => {
                pendingRequest = null;
            }

            const loaded = ref(false);
            const error = ref();
            const delayed = ref(!!delay);

            if (delay) {
                setTimeout(() => {
                    delayed.value = false;
                }, delay);
            }

            if (timeout != null) {
                setTimeout(() => {
                    if (!resolvedComp && !error.value) {
                        const err = new Error(`Async component timed out after ${timeout}ms.`);
                        onError(err);
                        error.value = err;
                    }
                }, timeout)
            }

            load().then(() => {
                loaded.value = true;
            }).catch(err => {
                onError(err);
                error.value = err;
            })

            return () => {
                if (loaded.value && resolvedComp) {
                    return createInnerComp(resolvedComp, instance);
                }
                else if (error.value && errorComponent) {
                    return createVNode(errorComponent, {
                        error: error.value
                    })
                }
                else if (loadingComponent && !delayed.value) {
                    return createVNode(loadingComponent);
                }
            }

        }
    })
}


function createInnerComp(comp, parent) {
    const {ref, props, children} = parent.vnode;
    const vnode = createVNode(comp, props, children);
    vnode.ref = ref;
    return vnode;
}