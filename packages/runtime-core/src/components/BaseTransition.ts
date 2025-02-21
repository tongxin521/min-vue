import { toRaw } from "@vue/reactivity";
import { onBeforeUnmount, onMounted } from "../apiLifecycle";
import { getCurrentInstance } from "../component";
import { Fragment, cloneVNode, isSameVNodeType } from "../vnode";
import { isKeepAlive } from "./KeepAlive";
import { ShapeFlags, isArray, isFunction } from "@vue/shared";
const TransitionHookValidator = [Function, Array]

const leaveCbKey = Symbol('_leaveCb');
const enterCbKey = Symbol('_enterCb')

export const BaseTransitionPropsValidators = {
    mode: String,
    appear: Boolean,
    persisted: Boolean,
    // enter
    onBeforeEnter: TransitionHookValidator,
    onEnter: TransitionHookValidator,
    onAfterEnter: TransitionHookValidator,
    onEnterCancelled: TransitionHookValidator,
    // leave
    onBeforeLeave: TransitionHookValidator,
    onLeave: TransitionHookValidator,
    onAfterLeave: TransitionHookValidator,
    onLeaveCancelled: TransitionHookValidator,
    // appear
    onBeforeAppear: TransitionHookValidator,
    onAppear: TransitionHookValidator,
    onAfterAppear: TransitionHookValidator,
    onAppearCancelled: TransitionHookValidator,
  }

const BaseTransitionImpl = {
    name: `BaseTransition`,

    props: BaseTransitionPropsValidators,

    setup(props, { slots }) {
        const instance = getCurrentInstance();
        const state = useTransitionState()

        return () => {
            const children = slots.default && getTransitionRawChildren(slots.default(), true)
            if (!children || !children.length) {
                return;
            }

            let child = children[0];
            if (children.length > 1) {
                let hasFound = false;
                for (const c of children) {
                    child = c;
                    hasFound = true
                }
            }

            const rawProps = toRaw(props);
            const {mode} = rawProps;

            if (state.isLeaving) {
                return emptyPlaceholder(child);
            }

            const innerChild = getKeepAliveChild(child);

            if (!innerChild) {
                return emptyPlaceholder(child);
            }

            let enterHooks = resolveTransitionHooks(
                innerChild,
                rawProps,
                state,
                instance,
                // 确保enterHooks在克隆后是最新的
                hooks => (enterHooks = hooks),
            )

            setTransitionHooks(innerChild, enterHooks);

            const oldChild = instance.subTree;
            const oldInnerChild = oldChild && getKeepAliveChild(oldChild);
            
            if (oldInnerChild &&
                oldInnerChild.type !== Comment &&
                !isSameVNodeType(innerChild, oldInnerChild) &&
                recursiveGetSubtree(instance).type !== Comment
            ) {
                const leavingHooks = resolveTransitionHooks(
                    oldInnerChild,
                    rawProps,
                    state,
                    instance,
                );
                setTransitionHooks(oldInnerChild, leavingHooks);
                if (mode !== 'in-out' && innerChild.type !== Comment) {
                    state.isLeaving = true;
                    // 返回占位符节点，并在离开完成后更新队列
                    (leavingHooks as any).afterLeave = () => {
                        state.isLeaving = false
                        // #6835
                        // 当active未定义时也需要更新
                        if (instance.update.active !== false) {
                          instance.effect.dirty = true
                          instance.update()
                        }
                    }
                    return emptyPlaceholder(child)
                }
                else if (mode === 'out-in') {
                    (leavingHooks as any).delayLeave = (
                        el,
                        earlyRemove,
                        delayedLeave,
                    ) => {
                      // 缓存离开的VNode
                        const leavingVNodesCache = getLeavingNodesForType(
                            state,
                            oldInnerChild,
                        )
                        leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild
                        el[leaveCbKey] = () => {
                            earlyRemove()
                            el[leaveCbKey] = undefined
                            delete (enterHooks as any).delayedLeave
                        }
                        (enterHooks as any).delayedLeave = delayedLeave
                    }
                }
            }
            return child;
        }

    }
}

export function useTransitionState() {
    const state = {
        isMounted: false,
        isLeaving: false,
        isUnmounting: false,
        leavingVNodes: new Map(), 
    }

    onMounted(() => {
        state.isMounted = true;
    })
    
      // 当组件即将卸载时执行
    onBeforeUnmount(() => {
        state.isUnmounting = true ;
    })
    
    return state 
}

export function getTransitionRawChildren(
    children,
    keepComment = false,
    parentKey?
) {
    let ret = [];

    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        const key =
            parentKey == null
                ? child.key
                : String(parentKey) + String(child.key != null ? child.key : i);
        if (keepComment || child.type !== Comment) {
            ret.push(key != null ? cloneVNode(child, { key }) : child)
        }
    }

    return ret;
}

function emptyPlaceholder(vnode) {
    if (isKeepAlive(vnode)) {
      vnode = cloneVNode(vnode)
      vnode.children = null
      return vnode
    }
}


function getKeepAliveChild(vnode) {
    if (!isKeepAlive(vnode)) {
      return vnode
    }
  
    const { shapeFlag, children } = vnode
  
    if (children) {
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        return children[0]
      }
  
      if (
        shapeFlag & ShapeFlags.SLOTS_CHILDREN &&
        isFunction((children as any).default)
      ) {
        return (children as any).default()
      }
    }
}


export function resolveTransitionHooks(
    vnode,
    props,
    state,
    instance,
    postClone?,
  ) {
    const {
      appear,
      mode,
      persisted = false,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onEnterCancelled,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
      onLeaveCancelled,
      onBeforeAppear,
      onAppear,
      onAfterAppear,
      onAppearCancelled,
    } = props
    const key = String(vnode.key)
    const leavingVNodesCache = getLeavingNodesForType(state, vnode)
  
    const callHook = (hook, args) => {
      hook?.(...args)
    }
  
    const callAsyncHook = (
      hook,
      args,
    ) => {
      const done = args[1]
      callHook(hook, args)
      if (isArray(hook)) {
        if (hook.every(hook => hook.length <= 1)) done()
      } else if (hook.length <= 1) {
        done()
      }
    }
  
    const hooks = {
      mode,
      persisted,
      /**
       * 在元素进入之前执行的操作
       *
       * @param el 要进入的元素
       */
      beforeEnter(el) {
        // 定义钩子函数
        let hook = onBeforeEnter
  
        // 如果组件未挂载
        if (!state.isMounted) {
          // 如果设置了appear属性
          if (appear) {
            // 使用onBeforeAppear钩子，如果不存在则使用onBeforeEnter钩子
            hook = onBeforeAppear || onBeforeEnter
          } else {
            // 如果没有设置appear属性，则直接返回
            return
          }
        }
  
        // for same element (v-show)
        // 对于相同的元素（v-show）
        if (el[leaveCbKey]) {
          // 调用回调函数，传入true表示取消
          el[leaveCbKey](true /* cancelled */)
        }
  
        // for toggled element with same key (v-if)
        // 对于具有相同键的切换元素（v-if）
        const leavingVNode = leavingVNodesCache[key]
        if (
          leavingVNode &&
          isSameVNodeType(vnode, leavingVNode) &&
          leavingVNode.el[leaveCbKey]
        ) {
          // 强制提前移除（未取消）
          // force early removal (not cancelled)
          leavingVNode.el[leaveCbKey]!()
        }
  
        // 调用钩子函数
        callHook(hook, [el])
      },
  
      enter(el) {
        let hook = onEnter
        let afterHook = onAfterEnter
        let cancelHook = onEnterCancelled
        if (!state.isMounted) {
          if (appear) {
            hook = onAppear || onEnter
            afterHook = onAfterAppear || onAfterEnter
            cancelHook = onAppearCancelled || onEnterCancelled
          } else {
            return
          }
        }
        let called = false
        const done = (el[enterCbKey] = (cancelled?) => {
          if (called) return
          called = true
          if (cancelled) {
            callHook(cancelHook, [el])
          } else {
            callHook(afterHook, [el])
          }
          if ((hooks as any).delayedLeave) {
            (hooks as any).delayedLeave()
          }
          el[enterCbKey] = undefined
        })
        if (hook) {
          callAsyncHook(hook, [el, done])
        } else {
          done()
        }
      },
  
      leave(el, remove) {
        const key = String(vnode.key)
        if (el[enterCbKey]) {
          el[enterCbKey](true /* cancelled */)
        }
        if (state.isUnmounting) {
          return remove()
        }
        callHook(onBeforeLeave, [el])
        let called = false
        const done = (el[leaveCbKey] = (cancelled?) => {
          if (called) return
          called = true
          remove()
          if (cancelled) {
            callHook(onLeaveCancelled, [el])
          } else {
            callHook(onAfterLeave, [el])
          }
          el[leaveCbKey] = undefined
          if (leavingVNodesCache[key] === vnode) {
            delete leavingVNodesCache[key]
          }
        })
        leavingVNodesCache[key] = vnode
        if (onLeave) {
          callAsyncHook(onLeave, [el, done])
        } else {
          done()
        }
      },
  
      clone(vnode) {
        const hooks = resolveTransitionHooks(
          vnode,
          props,
          state,
          instance,
          postClone,
        )
        if (postClone) postClone(hooks)
        return hooks
      },
    }
  
    return hooks
}

export function setTransitionHooks(vnode, hooks) {
    if (vnode.shapeFlag & ShapeFlags.COMPONENT && vnode.component) {
      setTransitionHooks(vnode.component.subTree, hooks)
    } else {
      vnode.transition = hooks
    }
}
const recursiveGetSubtree = (instance) => {
    const subTree = instance.subTree
    return subTree.component ? recursiveGetSubtree(subTree.component) : subTree
}

function getLeavingNodesForType(
    state,
    vnode,
){
    // 从state中获取leavingVNodes
    const { leavingVNodes } = state
  
    // 从leavingVNodes中获取对应vnode.type的缓存
    let leavingVNodesCache = leavingVNodes.get(vnode.type)!
  
    // 如果缓存不存在
    if (!leavingVNodesCache) {
      // 创建一个新的空对象作为缓存
      leavingVNodesCache = Object.create(null)
      // 将新的缓存设置到leavingVNodes中
      leavingVNodes.set(vnode.type, leavingVNodesCache)
    }
  
    // 返回对应的缓存
    return leavingVNodesCache
}