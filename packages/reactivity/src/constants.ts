export enum DirtyLevels {
    // 表示依赖项当前是干净的，即它自上次计算以来没有发生变化，并且不需要重新计算。
    // 在Vue的响应式系统中，当依赖项被首次创建或确认其依赖的数据没有变化时，它会被标记为NotDirty。
    NotDirty = 0,
    // 这个状态可能表示Vue正在查询或检查依赖项是否变脏的过程中。它可能是一个过渡状态，用于在确认依赖项状态之前暂时标记依赖项。
    QueryingDirty = 1,
    // 这个状态特别针对计算属性，并且可能表示计算属性在其依赖的响应式数据发生变化时，除了需要重新计算之外，
    // 还可能触发了一些副作用（side effects）。副作用可能包括执行额外的函数、更新其他状态或触发其他响应式效果。
    MaybeDirty_ComputedSideEffect = 2,
    // 这个状态更广泛地表示依赖项可能变脏了，但尚未确认。它可能用于那些不特定于计算属性副作用的依赖项。
    //当依赖项所依赖的响应式数据发生变化时，Vue会将依赖项的状态更新为MaybeDirty，并在后续的更新周期中确认是否需要真正重新计算或更新。
    MaybeDirty = 3,
    // 表示依赖项确实变脏了，并且需要重新计算。在Vue的响应式系统中，当确认依赖项所依赖的响应式数据确实发生了变化，
    // 并且这个变化影响了依赖项的结果时，依赖项会被标记为Dirty。一旦依赖项被标记为Dirty，Vue将在适当的时机（如下一个渲染周期）重新计算它。
    Dirty = 4,
  }

  export enum ReactiveFlags {
    SKIP = '__v_skip',
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    IS_SHALLOW = '__v_isShallow',
    RAW = '__v_raw',
  }