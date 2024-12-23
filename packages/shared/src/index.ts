export * from './general';
export function isObject(value) {
    return value !== null && typeof value === 'object'
}

export const extend = Object.assign

export function NOOP () {}


export function isFunction (value) {
    return typeof value === 'function'
}


export function isArray (value) {
    return Array.isArray(value)
}


export function isString (value) {
    return typeof value === 'string'
}

export const EMPTY_OBJ = Object.freeze({});