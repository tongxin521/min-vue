import { createSetupContext, getCurrentInstance } from "./component";

export function defineProps() {
    return null;
}

export function defineEmits() {
    return null;
}

export function defineExpose() {
    return null;
}

export function defineOptions() {
    return null;
}

export function defineSlots() {
    return null;
}

export function defineModel() {
    return null;
}


export function withDefaults() {
    return null;
}

export function useSlots() {
    return getContext().slots;
}

export function useAttrs() {
    return getContext().attrs;
}

function getContext() {
    const i = getCurrentInstance();
    return i.setupContext || (i.setupContext = createSetupContext(i))
}