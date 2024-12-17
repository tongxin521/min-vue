function createInvoker(value) {
    const invoker = (e) => invoker.value(e);
    invoker.value = value;
    return invoker;
}

export function patchEvent(el, rawName, pre, next) {
    const invokers = el[rawName] || {};
    const existingInvoker = invokers[rawName];

    if (next && existingInvoker) {
        existingInvoker.value = next;
    }
    else {
        if (next) {
            const invoker = invokers[rawName] = createInvoker(next);
            el.addEventListener(el, rawName, invoker)
        }
        else {
            el.removeEventListener(rawName, invokers[rawName]);
            delete invokers[rawName];
        }

    }
}