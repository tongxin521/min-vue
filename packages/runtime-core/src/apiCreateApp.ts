import { NO } from "@vue/shared";

export function createAppContext() {
    // 创建一个AppContext对象并返回
    return {
      // 应用实例
      app: null,
      // 配置对象
      config: {
        // 是否为原生标签
        isNativeTag: NO,
        // 是否启用性能监控
        performance: false,
        // 全局属性
        globalProperties: {},
        // 选项合并策略
        optionMergeStrategies: {},
        // 错误处理函数
        errorHandler: undefined,
        // 警告处理函数
        warnHandler: undefined,
        // 编译器选项
        compilerOptions: {},
      },
      // 混入对象数组
      mixins: [],
      // 组件对象
      components: {},
      // 指令对象
      directives: {},
      // 依赖注入对象
      provides: Object.create(null),
      // 选项缓存
      optionsCache: new WeakMap(),
      // 属性缓存
      propsCache: new WeakMap(),
      // 事件缓存
      emitsCache: new WeakMap(),
    }
  }