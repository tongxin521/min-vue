export function isObject(value) {
    return value !== null && typeof value === 'object'
}

export const extend = Object.assign

export function NOOP () {}


export function isFunction (value) {
    return typeof value === 'function'
}