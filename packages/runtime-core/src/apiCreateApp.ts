import { NO, extend, isFunction, isObject } from "@vue/shared";
import { createVNode } from "./vnode";
import { getComponentPublicInstance } from "./component";
import { version } from ".";

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

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = extend({}, rootComponent);
    }

    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }

    const context = createAppContext();
    const installedPlugins = new WeakSet();

    let isMounted = false

    const app = (context.app = {
        // 根标签 
        _container: null,
        _context: context,
        // 根组件
        _component: rootComponent,

        version,

        get config() {
          return context.config;
        },
        use(plugin, ...options) {
          if (plugin && isFunction(plugin.install)) {
            installedPlugins.add(plugin);
            plugin.install(app, ...options);
          }
          else if (isFunction(plugin)) {
            installedPlugins.add(plugin);
            plugin(app, ...options);
          }
          return app;
        },
        mixin(mixin) {
            if (!context.mixins.includes(mixin)) {
                context.mixins.push(mixin);
            }

            return app;
        },
        component(name, component) {
          if (!component) {
            return context.components[name]
          }
          context.components[name] = component
          return app;
        },
        directive(name, directive) {
            if (!directive) {
                return context.directives[name]
            }

            context.directives[name] = directive;
            return app;
        },
        mount(rootContainer) {
            if (!isMounted) {
                const vnode = createVNode(rootComponent, rootProps);
                vnode.appContext = context;
                render(vnode, rootContainer);
                isMounted = true;
                app._container = rootContainer;
                rootContainer.__vue_app__ = app;
                return getComponentPublicInstance(vnode.component);
            }
        },
        unmount() {
          if (isMounted) {
            render(null, app._container)
            delete app._container.__vue_app__
          }
        },
        provide(key, value) {
            context.provides[key] = value;
        },
        runWithContext(fn) {
            const lastApp = currentApp;
            currentApp = app;
            try {
                return fn();
            }
            finally {
                currentApp = lastApp;
            }
        }
    });

    return app;
  }
}

export let currentApp;