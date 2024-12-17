export function patchStyle(el, pre, next) {
    for (let key in next) {
        el.style[key] = next[key];
    }

    for (let key in pre) {
        if (!next[key]) {
            el.style[key] = null;
        }
    }
}