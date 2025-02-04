function createInvoker(value) {
    const invoker = (e) => invoker.value(e);
    invoker.value = value;
    return invoker;
}
const veiKey = Symbol('_vei')
export function patchEvent(el, rawName, pre, next) {
    const invokers = el[veiKey] || (el[veiKey] = {});
    const existingInvoker = invokers[rawName];

    if (next && existingInvoker) {
        existingInvoker.value = next;
    }
    else {
        const name = rawName.slice(2).toLowerCase();
        if (next) {
            const invoker = invokers[rawName] = createInvoker(next);
            el.addEventListener(name, invoker)
        }
        else {
            el.removeEventListener(rawName, invokers[rawName]);
            delete invokers[rawName];
        }

    }
}