# diff 算法

*** 全量 diff 算法 ***
1. 准备首尾两个指针 i, e1, e2
2. 正向循环，如果首指针指向的节点相同，则首指针同时向后移动，不相同则结束循环
3. 逆向循环，如果尾指针指向的节点相同，则尾指针同时向前移动，不相同则结束循环
4. 循环结束，分为以下几种情况
    + 如果 n1 的子节点都循环完了， n2 的子节点长度大于 n1 的子节点长度，则挂载剩余 n2 的子节点
    + 如果 n2 的子节点都循环完了， n1 的子节点长度大于 n2 的子节点长度，则卸载剩余 n1 的子节点
    + 如果都没有循环完，则将 n2 的子节点存储在 keyToNewIndexMap，存储结构 key - index。
        倒序便利剩余 n2 的子节点, 在映射中获取相同子节点，如果有，patch 更新，如果没有，则创建子节点

全量diff算法有个缺点，例如：
``` js
vnode = [b, c]
vnode1 = [a, b, c , d]
```

在这种情况下，需要将 n2 的子节点全部创建出来，再一一对比更新。实际情况下，我们只需要处理 a 和 d 就可以了。
vue 源码中针对这种情况，使用了最长递增子序列（Longest Increasing Subsequence，简称 LIS）算法。来优化 diff 算法。
<a href="https://zh.wikipedia.org/wiki/%E6%9C%80%E9%95%BF%E9%80%92%E5%A2%9E%E5%AD%90%E5%BA%8F%E5%88%97"></a>
核心思想： 找出最长递增子序列，然后根据这个最长递增子序列来更新节点。




# 之前是文本子节点，当前是文本子节点， 更新文本节点

```js
const vnode = h('div', 'hello');
const vnode1 = h('div', 'world');
```

# 之前是文本子节点，当前是空节点
```js
const vnode = h('div', 'hello');
const vnode1 = h('div', );
```

# 之前是是文本子节点，当前是数组子节点
```js
const vnode = h('div', 'hello');
const vnode1 = h('div', [h('span', 'hello'), 'word']);
```


# 之前是数组子节点，当前是文本子节点

```js
const vnode = h('div', [
    h('span',  'hello'),
    h('span', 'world')
]);
const vnode1 = h('div', 'hello');
```

# 之前是数组子节点，当前是空节点

```js
const vnode = h('div', [
    h('span',  'hello'),
    h('span', 'world')
]);
const vnode1 = h('div',);

```

# 之前是数组子节点，当前是数组子节点
```js
const vnode = h('div', [
    h('span', {key: 1},  'hello'),
    h('span',  {key: 2}, 'world')
]);
const vnode1 = h('div', [
    h('span', {key: 1},'hello1'),
    h('span', {key: 2},'word1')
]);
```
