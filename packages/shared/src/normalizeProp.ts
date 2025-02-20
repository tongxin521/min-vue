import { isArray, isObject, isString } from ".";

export function normalizeClass(value) {
    let res = '';

    if (isString(value)) {
        res = value;
    }
    else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const normalized = normalizeClass(value[i]);
            if (normalized) {
                res += normalized + ' ';
            }
        }
    }
    else if (isObject(value)) {
        for (const name in value) {
            if (value[name]) {
                res += name + ' ';
            }
        }
    }

    return res.trim();
}


export function normalizeStyle(value) {
    if (isArray(value)) {
        const res = {};
        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            const normalized = isString(item)
                ? parseStringStyle(item)
                : normalizeStyle(item);

            if (normalized) {
                for (const key in normalized) {
                    res[key] = normalized[key];
                }
            }
        }
        return res;
    }
    else if (isString(value) || isObject(value)) {
        return value;
    }
}

const listDelimiterRE = /;(?![^(]*\))/g
const propertyDelimiterRE = /:([^]+)/
const styleCommentRE = /\/\*[^]*?\*\//g
export function parseStringStyle(cssText: string) {
    // 初始化一个空对象来存储解析后的样式
    const ret = {}
  
    // 使用正则表达式替换掉注释部分
    cssText
      .replace(styleCommentRE, '')
      // 使用正则表达式将样式字符串按照列表分隔符分割成多个项
      .split(listDelimiterRE)
      .forEach(item => {
        if (item) {
          // 将每个项按照属性分隔符分割成键值对
          const tmp = item.split(propertyDelimiterRE)
          // 如果分割后的数组长度大于1，则将键值对存入ret对象中
          tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
        }
      })
  
    // 返回解析后的样式对象
    return ret
  }