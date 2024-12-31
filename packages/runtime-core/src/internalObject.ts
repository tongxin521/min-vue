const internalObjectProto = {}

export const createInternalObject = () => Object.create(internalObjectProto)