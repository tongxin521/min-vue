import { makeMap } from "./makeMap";

export const isOn = (key) => key.charCodeAt(0) === 111 /* o */ &&
key.charCodeAt(1) === 110 /* n */ &&
// uppercase letter
(key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);


export const isReservedProp = /*#__PURE__*/ makeMap(
    // the leading comma is intentional so empty string "" is also included
    ',key,ref,ref_for,ref_key,' +
      'onVnodeBeforeMount,onVnodeMounted,' +
      'onVnodeBeforeUpdate,onVnodeUpdated,' +
      'onVnodeBeforeUnmount,onVnodeUnmounted',
  )

export const NO = () => false;