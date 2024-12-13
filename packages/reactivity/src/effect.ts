import { NOOP, extend } from "@vue/shared";
import { DirtyLevels } from "./constants";

export let activeEffect;
export function effect(fn, options) {
    const _errect = new reactiveEffect(fn, NOOP, () => {
        _errect.run();
    });

    if (options) {
        extend(_errect, options);
    }
    _errect.run();

    const running = _errect.run.bind(_errect);
    running.effect = _errect;
    return running;
}


export class reactiveEffect {
    active = true; // 是否激活
    deps = []; // 依赖
    _dirtyLevel = DirtyLevels.Dirty; // 脏值级别
    _trackId = 0; // 跟踪id
    _depsLength = 0; // 依赖项长度
    _running = 0; // 运行
    constructor(public fn, public trigger, public scheduler) {
    }

    get dirty() {
        return this._dirtyLevel > DirtyLevels.NotDirty;
    }

    set dirty(v) {
        this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NotDirty;
    }

    run() {
        this._dirtyLevel = DirtyLevels.NotDirty;
        if (!this.active) {
            return this.fn();
        }
        const lastEffect = activeEffect;
        try {
            
            activeEffect = this;
            preCleanEffect(this);
            this._running++;
            return this.fn();
        } finally {
            this._running--;
            postCleanEffect(this);
            activeEffect = lastEffect;
        }
    }

    stop() {
        if (this.active) {
            this.active = false;
        }
    }
}

function preCleanEffect(effct) {
    effct._trackId++;
    effct._depsLength = 0;
}

function postCleanEffect(effct) {
    if (effct.deps.length > effct._depsLength) {
        for (let i = effct._depsLength; i < effct.deps.length; i++) {
            cleanupDepEffect(effct.deps[i], effct);
            effct._depsLength = effct.deps.length;
        }
    }
}


function cleanupDepEffect(dep, effct) {
    const trackId = dep.get(effct);

    if (trackId !== undefined && effct._trackId != trackId) {
        dep.delete(effct);

        if (dep.size === 0) {
            dep.cleanup();
        }
    }

}


export function trackEffect(effct, dep) {
    if (dep.get(effct) !== effct._trackId) {
        dep.set(effct, effct._trackId);
        const oldDep = effct.deps[effct._depsLength];

        if (oldDep !== dep) {
            if (oldDep) {
                cleanupDepEffect(oldDep, effct);
            }
            effct.deps[effct._depsLength] = dep;
        }
        else {
            effct._depsLength++;
        }
    }

}


export function triggerEffect(dep) {
    for (const effct of dep.keys()) {
        if (effct._dirtyLevel < DirtyLevels.Dirty) {
            effct._dirtyLevel = DirtyLevels.Dirty;
        }

        effct.scheduler();
        
    }
}