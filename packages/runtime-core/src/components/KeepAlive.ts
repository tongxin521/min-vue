import { ShapeFlags, invokeArrayFns, isArray, isRegExp, isString, remove } from "@vue/shared";
import { currentInstance, getComponentName, getCurrentInstance } from "../component";
import { queuePostRenderEffect } from "../renderer";
import { watch } from "../apiWatch";
import { cloneVNode, isSameVNodeType, isVNode } from "../vnode";
import { injectHook, onBeforeUnmount, onMounted, onUnmounted, onUpdated } from "../apiLifecycle";
import { LifecycleHooks } from "../enums";

const KeepAliveImpl = {
    name: 'KeepAlive',
    props: {
        include: [String, RegExp, Array],
        exclude: [String, RegExp, Array],
        max: [String, Number]
    },
    __isKeepAlive: true,
    setup(props, { slots }) {
        const instance = getCurrentInstance();
        const sharedContext = instance.ctx;

        const cache = new Map();
        const keys = new Set();

        let current = null;

        const {
            renderer: {
              p: patch,
              m: move,
              um: _unmount,
              o: { createElement },
            },
        } = sharedContext

        const storageContainer = createElement('div');

        sharedContext.activate = (vnode, container, anchor) => {
            const instance = vnode.component;

            move(vnode, container, anchor);
            patch(
                instance.vnode,
                vnode,
                container,
                anchor,
                instance,
            );
            queuePostRenderEffect(() => {
                instance.isDeactivated = false;
                if (instance.a) {
                    invokeArrayFns(instance.a)
                }
            });
        }

        sharedContext.deactivate = (vnode) => {
            const instance = vnode.component
            move(vnode, storageContainer, null)
            queuePostRenderEffect(() => {
                if (instance.da) {
                    invokeArrayFns(instance.da)
                }
                instance.isDeactivated = true;
            })
        }

        function unmount(vnode) {
            _unmount(vnode, instance);
            resetShapeFlag(vnode);
        }

        function pruneCache(filter) {
            cache.forEach((vnode, key) => {
                const name = getComponentName(vnode.type);
                if (name && (!filter || !filter(name))) {
                    pruneCacheEntry(key);
                }
            });
        }

        function pruneCacheEntry(key) {
            const cached = cache.get(key);
            if (!current || !isSameVNodeType(cached, current)) {
                unmount(cached);
            }
            else if (current) {
                resetShapeFlag(current);
            }

            cache.delete(key);
            keys.delete(key);
        }

        watch(
            () => [props.include, props.exclude],
            ([include, exclude]) => {
                include && pruneCache(name => matches(include, name))
                exclude && pruneCache(name => !matches(exclude, name))
            },
            {
            flush: 'post',
            deep: true
        });

        let pendingCacheKey = null;

        const cacheSubtree = () => {
            if (pendingCacheKey != null) {
                cache.set(pendingCacheKey, instance.subTree);
            }
        }

        onMounted(cacheSubtree);
        onUpdated(cacheSubtree);

        onBeforeUnmount(() => {
            cache.forEach(cached => {
                const {subTree} = instance;
                if (cached.type === subTree.type && cached.key === subTree.key) {
                    resetShapeFlag(subTree);
                    const da = subTree.component.da;
                    da && queuePostRenderEffect(da)
                    return;
                }
                unmount(cached);
            });
        });

        return () => {
            pendingCacheKey = null;
            if (!slots.default) {
                return
            }

            const children = slots.default();
            const rawVNode = children[0];

            if (children.length > 1) {
                current = null;
                return children;
            }
            else if (!isVNode(rawVNode) || !(rawVNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
                current = null;
                return rawVNode;
            }

            let vnode = rawVNode;

            const comp = vnode.type;

            const name = getComponentName(comp);

            const {include, exclude, max} = props;

            if (
                (include && (!name || !matches(include, name))) ||
                (exclude && name && matches(exclude, name))
            ) {
                current = vnode
                return rawVNode
            }

            const key = vnode.key == null ? comp : vnode.key;
            const cachedVNode = cache.get(key);

            if (vnode.el) {
                vnode = cloneVNode(vnode);
            }

            pendingCacheKey = key;

            if (cachedVNode) {
                vnode.el = cachedVNode.el;
                vnode.component = cachedVNode.component;
                vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
                keys.delete(key);
                keys.add(key);
            }
            else {
                keys.add(key);
                if (max && keys.size > parseInt(max, 10)) {
                    pruneCacheEntry(keys.values().next().value)
                }
            }
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
            current = vnode;
            return vnode;

        }
    }
}
export const KeepAlive = KeepAliveImpl;

function resetShapeFlag(vnode) {
    vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
    vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
}

function matches (pattern, name) {
    if (isArray(pattern)) {
        return pattern.some(p => matches(p, name))
    }
    else if (isString(pattern)) {
        return pattern.split(',').includes(name)
    }
    else if (isRegExp(pattern)) {
        return pattern.test(name)
    }

    return false;
}

export const isKeepAlive  = (vnode) => vnode.type.__isKeepAlive;

export function onActivated(hook, target) {
    registerKeepAliveHook(hook, LifecycleHooks.ACTIVATED, target);
}

export function onDeactivated(hook, target) {
    registerKeepAliveHook(hook, LifecycleHooks.DEACTIVATED, target);
}

function registerKeepAliveHook(hook, type, target = currentInstance) {
    const wrappedHook = hook.__wdc || (hook.__wdc = () => {
        let current = target;
        while (current) {
            if (current.isDeactivated) {
                return;
            }
            current = current.parent
        }
        return hook();
    })
    injectHook(type, wrappedHook, target);

    if (target) {
        let current = target.parent
        while(current && current.parent) {
            if (isKeepAlive(current.parent.vnode)) {
                injectToKeepAliveRoot(wrappedHook, type, target, current)
            }
            current = current.parent
        }
    }
}

function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
    const injected = injectHook(type, hook, keepAliveRoot, true);
    onUnmounted(() => {
        remove(keepAliveRoot[type], injected)
    }, target)

}