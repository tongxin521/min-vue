import { ShapeFlags, isArray, isFunction } from "@vue/shared";
import { createInternalObject } from "./internalObject";
import { normalizeVNode } from "./vnode";

// 插槽内部属性
const isInternalKey = (key: string) => key[0] === '_' || key === '$stable'
const normalizeSlotValue = value => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];

const normalizeVNodeSlots = (instance, children) => {
    const normalized = normalizeSlotValue(children);
    instance.slots.default = () => normalized;
};

const normalizeSlot = (key, rawSlot) => {
    const normalized = (...args) => normalizeSlotValue(rawSlot(...args));
    return normalized;
}

const normalizeObjectSlots = (rawSlots, slots, instance) => {
    for (const key in rawSlots) {
        if (isInternalKey(key)) continue
        const value = rawSlots[key];

        if (isFunction(value)) {
            slots[key] = normalizeSlot(key, value);
        }
        else if (value != null) {
            const normalized = normalizeSlotValue(value);
            slots[key] = () => normalized;
        }
    }
};

export function initSlots(instance, children) {
    const slots = (instance.slots = createInternalObject());

    if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        // const type = children._;
        // if (type) {
        //     assignSlots(slots, children)
        // }
        // else {
        normalizeObjectSlots(children, slots , instance)
        // }
    }
    else if (children){
        normalizeVNodeSlots(instance, children)
    }
}