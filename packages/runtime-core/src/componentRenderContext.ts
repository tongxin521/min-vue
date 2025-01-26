export let currentRenderingInstance = null;

export function setCurrentRenderingInstance(instance) {
    const pre = currentRenderingInstance;
    currentRenderingInstance = instance;
    return pre;
}