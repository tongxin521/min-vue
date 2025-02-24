import { isObject } from '../../shared/src';
import { ReactiveFlags } from './constants';
import { reactive, reactiveMap, readonly, shallowReactiveMap } from './reactive';
import { track, trigger } from './reactiveEffect';

class BaseReactiveHandler {
    constructor(
        protected readonly _isReadonly = false,
        protected readonly _isShallow = false
    ) {}

    get(target, key, receiver) {
        const isShallow = this._isShallow;
        const isReadonly = this._isReadonly;
        if (key === ReactiveFlags.IS_REACTIVE) {
          return !isReadonly
        } else if (key === ReactiveFlags.IS_READONLY) {
          return isReadonly
        } else if (key === ReactiveFlags.IS_SHALLOW) {
          return isShallow
        }
        else if (key === ReactiveFlags.RAW) {
            if ((isShallow ? shallowReactiveMap
                : reactiveMap).get(target)
            ){
                return target;
            }
            return;
        }
        const res = Reflect.get(target, key, receiver);
        
        if (!isReadonly) {
            track(target, key);
        }
        

        if (isShallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    }
}

class MutableReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow = false) {
        super(false, isShallow);
    }
    set(target, key, value, receiver) {
        const oldValue = target[key];
        const result = Reflect.set(target, key, value, receiver);
        if (oldValue !== value) {
            trigger(target, key);
        }
        return result;
    }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow = false) {
        super(true, isShallow);
    }
    set() {
        return true;
    }

    deleteProperty(target, key) {
        return true;
    }
}

export const mutableHandler = new MutableReactiveHandler();

export const shallowReactiveHandlers = new MutableReactiveHandler(true);

export const readonlyHandlers = new ReadonlyReactiveHandler();

export const shallowReadonlyHandlers = new ReadonlyReactiveHandler(true);
