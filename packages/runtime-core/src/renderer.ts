import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { isSameNodeType, normalizeVNode, Text, Fragment } from "./vnode";
import { EMPTY_OBJ, NOOP, invokeArrayFns } from "@vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { ReactiveEffect } from "@vue/reactivity";
import { renderComponentRoot, shouldUpdateComponent } from "./componentRenderUtils";
import { updateProps } from "./componentProps";
import { updateSlots } from "./componentSlots";
import { setRef } from "./rendererTemplateRef";
import { queueJob, queuePostFlushCb } from "./scheduler";

export const queuePostRenderEffect = queuePostFlushCb;

export function createRenderer(option) {
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        createComment: hostCreateComment,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
    } = option;

    const unmountComponent = (instance) => {
        const {subTree, bum, um} = instance;

        if (bum) {
            invokeArrayFns(bum);
        }

        // 卸载组件的子树
        unmount(subTree);

        if (um) {
            invokeArrayFns(um);
        }
    };

    const unmount = (vnode) => {
        const {shapeFlag} = vnode;

        if (shapeFlag & ShapeFlags.COMPONENT) {
            unmountComponent(vnode.component);
        }
        else {
            // 卸载元素节点
            hostRemove(vnode.el);
        }
        
    }

    

    const processElement = (n1, n2, container, anchor, parentComponent) => {
        if (n1 == null) {
            // 创建元素节点
            mountElement(n2, container, anchor, parentComponent)
        } else {
            // 更新元素节点
            patchElement(n1, n2, parentComponent)
        }
    };

    const patchElement = (n1, n2, parentComponent) => {
        const el = n2.el = n1.el;
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;

        patchChildren(n1, n2, el, null, parentComponent);
        patchProps(el, oldProps, newProps);
    }

    /**
     * 情况一：当前是文本子节点，之前也是文本子节点， 更新文本节点
     * 情况二：当前是文本子节点，之前是数组子节点，卸载数组子节点，更新文本节点
     * 情况三：之前是数组子节点，现在是数组子节点，更新数组子节点
     * 情况四：之前是数组子节点，现在没有节点，卸载数组子节点
     * 情况五：之前是文本子节点，现在是数组子节点，卸载文本子节点，挂载数组子节点
     */
    const patchChildren = (n1, n2, container, anchor, parentComponent) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const preShapeFlag = n1.shapeFlag;
        const {shapeFlag} = n2;

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 当前是文本子节点，之前是数组子节点，卸载数组子节点
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);
            }
            // 当前是文本子节点，之前也是文本子节点
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 当前是数组子节点，之前也是数组子节点
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    patchKeyedChildren(c1, c2, container);
                }
                // 没有子节点，卸载数组子节点
                else {
                    unmountChildren(c1);
                }
            }
            else {
                if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(container, '');
                }

                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(n2, container, anchor, parentComponent);
                }
            }
        }
    }


    const patchKeyedChildren = (c1, c2, container) => {
        // 首指针
        let i = 0;
        let len = c2.length;
        // 尾指针
        let e1 = c1.length - 1;
        let e2 = len -1;
        // 正向循环
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = (c2[i] = normalizeVNode(c2[i]));
            if (isSameNodeType(n1, n2)) {
                patch(n1, n2, container);
            } else {
                break;
            }
            i++;
        }
        // 反向循环
        while (i <= e2 || i <= e1) {
            const n1 = c1[e1];
            const n2 = (c2[e2] = normalizeVNode(c2[e2]));
            if (isSameNodeType(n1, n2)) {
                patch(n1, n2, container);
            } else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                // 挂载剩余节点
                while (i <= e2) {
                    const n = (c2[i] = normalizeVNode(c2[i]));
                    patch(null, n, container);
                    i++;
                }
            }
            
        }
        else if (i > e2) {
            // 卸载剩余节点
            while (i <= e1) {
                unmount(c1[i]);
                i++;
            }
            
        }

        else {
            const s1 = i;
            const s2 = i;
            
            const keyToNewIndexMap = new Map();

            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }

            let j;
            const toBePatched = e2 - s2 + 1;

            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                const key = prevChild.key;
                const newIndex = keyToNewIndexMap.get(key)

                if (newIndex === undefined) {
                    unmount(c1[i]);
                }
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;

                    patch(prevChild, c2[newIndex], container);
                }
            }
            const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
            j = increasingNewIndexSequence.length - 1;
            // 倒序挂载剩余节点
            for (i = toBePatched - 1; i >= 0; i--) {
                const newIndex = s2 + i;
                const nextChild = c2[newIndex];
                const anchor = c2[newIndex + 1]?.el;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, anchor);
                }
                else {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        move(nextChild, container, anchor)
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    };

    const move = (vnode, container, anchor) => {
        hostInsert(vnode.el, container, anchor);
    }

    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i]);
        }
    };

    const patchProps = (el, oldProps, newProps) => {
        for (let key in newProps) {
            const prev = oldProps[key];
            const next = newProps[key];
            if (prev !== next && key !== 'key') {
                hostPatchProp(el, key, prev, next);
            }
        }

        for (let key in oldProps) {
            if (!(key in newProps)) {
                
                hostPatchProp(el, key, oldProps[key], null);
                
            }
        }
    };

    
    const mountElement = (vnode, container, anchor, parentComponent) => {
        const el = vnode.el = hostCreateElement(vnode.type);
        const {props, shapeFlag} = vnode;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, vnode.children);
        }
        else {
            mountChildren(vnode, el, anchor, parentComponent)
        }
        if (props) {
            for (const key in props ) {
                if (key !== 'key' && key !== 'ref') {
                    hostPatchProp(el, key, null, props[key]);
                }
                
            }
        }
        hostInsert(el, container, anchor);
    };

    const mountChildren = (vnode, container, anchor, parentComponent) => {
        const { children } = vnode;
        for (let i = 0; i < children.length; i++) {
            const child = children[i] = normalizeVNode(children[i]);
            patch(null, child, container, anchor, parentComponent)
        }
    };

    const processText = (n1, n2, container, anchor) => {
        if (n1 == null) {
            hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
        } else {
            const el = n2.el = n1.el;
            if (n2.children !== n1.children) {
                hostSetText(el, n2.children);
            }
        }
    }

    const processFragment = (n1, n2, container, anchor, parentComponent) => {
        if (n1 == null) {
            mountChildren(n2, container, anchor, parentComponent);
        }
        else {
            patchChildren(n1, n2, container, anchor, parentComponent);
        }
    }

    const updateComponentPreRender = (instance, nextVNode) => {
        nextVNode.component = instance;
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
        updateProps(instance, nextVNode.props);
        updateSlots(instance, nextVNode.children);
    }

    const setupRenderEffect = (instance, initialVNode, container, anchor) => {
        const componentUpdateFn = () => {
            if (!instance.isMounted) {

                const {bm, m} = instance;
                const subTree = (instance.subTree = renderComponentRoot(instance));

                if (bm) {
                    invokeArrayFns(bm);
                }

                patch(null, subTree, container, anchor, instance)

                initialVNode.el = subTree.el;

                if (m) {
                    queuePostRenderEffect(m);
                }

                instance.isMounted = true;
            }
            else {
                let {next, bu, u, vnode} = instance;

                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                else {
                    next = vnode;
                }

                if (bu) {
                    invokeArrayFns(bu);
                }
                const nextTree = renderComponentRoot(instance);

                const prevTree = instance.subTree;

                instance.subTree = nextTree;
                patch(prevTree, nextTree, hostParentNode(vnode.el), getNextHostNode(prevTree), instance)

                next.el = nextTree.el

                if (u) {
                    queuePostRenderEffect(u);
                }
            }
            

        }
        const updata = (instance.update = () => {
            if (effect.dirty) {
                
                effect.run();
            }
        })

        const effect = (instance.effect = new ReactiveEffect(componentUpdateFn, NOOP, () => queueJob(updata)));

        
        updata();

    }

    const mountComponent = (initialVNode, container, anchor, parentComponent) => {
        const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent);

        setupComponent(instance)

        setupRenderEffect(instance, initialVNode, container, anchor);
    }

    const getNextHostNode = vnode => {
        if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
            return getNextHostNode(vnode.component.subTree);
        }

        const el = hostNextSibling(vnode.el);

        return el;
    }

    const updateComponent = (n1, n2) => {
        const instance = (n2.component = n1.component);

        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.effect.dirty = true;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }

    const processComponent = (n1, n2, container, anchor, parentComponent) => {
        if (n1 == null) {
            mountComponent(n2, container, anchor, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }

    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
        if (n1 === n2) {
            return;
        }

        if (n1 && !isSameNodeType(n1, n2)) {
            unmount(n1);
            n1 = null;
        }
        const {type, ref, shapeFlag} = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container, anchor);
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor, parentComponent);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor, parentComponent)
                }
                else if (shapeFlag & ShapeFlags.COMPONENT) {
                    processComponent(n1, n2, container, anchor, parentComponent)
                }
        }

        if (ref != null && parentComponent) {
            setRef(ref, n1 && n1.ref, n2 || n1, !n2)
        }

    }
    const render = (vnode, container) => {

        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode);
            }
        }
        else {
            patch(container._vnode || null, vnode, container)
            container._vnode = vnode;
        }
    }
    return {
        render
    }
}

/**
 * p 记录原数组
 * result 结果数组，初始化为包含0的数组
 */
function getSequence(arr: number[]): number[] {
    // 复制原数组
    const p = arr.slice()
    // 结果数组，初始化为包含0的数组
    const result = [0]
    let i, j, u, v, c
    // 获取原数组长度
    const len = arr.length
    // 遍历原数组
    for (i = 0; i < len; i++) {
      const arrI = arr[i]
      // 如果当前元素不为0
      if (arrI !== 0) {
        // 获取结果数组的最后一个元素
        j = result[result.length - 1]
        // 如果当前元素大于结果数组中最后一个元素对应的原数组元素
        if (arr[j] < arrI) {
          // 将当前元素在原数组中的索引添加到结果数组中
          p[i] = j
          result.push(i)
          continue
        }
  
        // 使用二分查找在结果数组中找到合适的位置
        u = 0
        v = result.length - 1
        while (u < v) {
          c = (u + v) >> 1
          // 如果结果数组中当前元素对应的原数组元素小于当前元素
          if (arr[result[c]] < arrI) {
            u = c + 1 
          } else {
            v = c
          }
        }
  
        // 如果当前元素小于结果数组中对应位置的元素
        if (arrI < arr[result[u]]) { 
          // 如果u大于0，则将当前元素的前一个元素的索引设置为p[i]
          if (u > 0) {
            p[i] = result[u - 1]
          }
          // 将当前元素的索引插入到结果数组中的合适位置
          result[u] = i
        }
      }
    }
  
    // 反向填充结果数组
    u = result.length 
    v = result[u - 1]
    while (u-- > 0) {
      // 将v的值赋给当前位置的元素
      result[u] = v
      // 将p[v]的值赋给v
      v = p[v]
    }
  
    // 返回结果数组
    return result
  }