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

export function invokeArrayFns(fns, ...args) {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...args);
  }
}

const cacheStringFunction = (fn) => {
  // 创建一个空对象作为缓存
  const cache = Object.create(null)

  // 返回一个新的函数，该函数接收一个字符串参数
  return ((str: string) => {
    // 检查缓存中是否已存在该字符串对应的值
    const hit = cache[str]

    // 如果缓存中存在，则直接返回缓存中的值
    // 否则，调用原始函数计算新值，并存储到缓存中，然后返回该值
    return hit || (cache[str] = fn(str))
  })
}
const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cacheStringFunction((str: string) =>
  str.replace(hyphenateRE, '-$1').toLowerCase(),
)


export const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value,
  })
}


export const remove = <T>(arr: T[], el: T) => {
  const i = arr.indexOf(el)
  if (i > -1) {
    arr.splice(i, 1)
  }
}