const internalObjectProto = {}

export const createInternalObject = () => Object.create(internalObjectProto)

export const isInternalObject = (obj: object) =>
    Object.getPrototypeOf(obj) === internalObjectProto