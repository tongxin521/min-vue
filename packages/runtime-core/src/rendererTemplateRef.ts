import { EMPTY_OBJ, ShapeFlags, hasOwn, isArray, isFunction, isString, remove } from "@vue/shared";
import { getExposeProxy } from "./component";
import { isRef } from "@vue/reactivity";
import { queuePostRenderEffect } from "./renderer";

export function setRef(rawRef, oldRawRef, vnode, isUnmount = false) {
    if (isArray(rawRef)) {
        rawRef.forEach((r, i) => setRef(
            r,
            oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef),
            vnode,
            isUnmount,
        ));
        return;
    }

    const refValue = vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
    ? getExposeProxy(vnode.component!) || vnode.component!.proxy
    : vnode.el;

    const value = isUnmount ? null : refValue;

    const { i: owner, r: ref } = rawRef

    const oldRef = oldRawRef?.r;
    const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs
    const setupState = owner.setupState;

    if (oldRef != null && oldRef !== ref) {
        if (isString(oldRef)) {
            refs[oldRef] = null;
            if (hasOwn(setupState, oldRef)) {
                setupState[oldRef] = null;
            }
        }
        else if (isRef(oldRef)) {
            oldRef.value = null;
        }
    }

    if (isFunction(ref)) {
        ref(value, refs)
    }
    else {
        const _isString = isString(ref);
        const _isRef = isRef(ref);
        const isVFor = rawRef.f;
        if (_isString || _isRef) {
            const doSet = () => {
                if (isVFor) {
                    const existing = _isString
                    ? hasOwn(setupState, ref)
                        ? setupState[ref]
                        : refs[ref]
                    : ref.value
                  if (isUnmount) {
                    isArray(existing) && remove(existing, refValue)
                  } else {
                    if (!isArray(existing)) {
                      if (_isString) {
                        refs[ref] = [refValue]
                        if (hasOwn(setupState, ref)) {
                          setupState[ref] = refs[ref]
                        }
                      } else {
                        ref.value = [refValue]
                        if (rawRef.k) refs[rawRef.k] = ref.value
                      }
                    } else if (!existing.includes(refValue)) {
                      existing.push(refValue)
                    }
                  }
                }
                else if (_isString) {
                    refs[ref] = value
                    if (hasOwn(setupState, ref)) {
                      setupState[ref] = value
                    }
                }
                else if (_isRef) {
                    ref.value = value
                    if (rawRef.k) {
                        refs[rawRef.k] = ref.value
                    }
                }
            }

            if (isUnmount || isVFor) {
                doSet()
              } else {
                queuePostRenderEffect(doSet);
              }
        }

    }
    

}