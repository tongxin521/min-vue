# 无状态组件挂载流程

1. createComponentInstance：创建组件实例
2. setupRenderEffect：渲染组件

# 有状态组件挂载流程

1. createComponentInstance：创建组件实例
2. setupComponent：设置组件状态
    1. initProps：初始化props
    2. setupStatefulComponent：设置组件状态
3. setupRenderEffect：渲染组件