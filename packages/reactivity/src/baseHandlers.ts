import { isObject } from '../../shared/src';
import { ReactiveFlags } from './constants';
import { reactive, reactiveMap, shallowReactiveMap } from './reactive';
import { track, trigger } from './reactiveEffect';

class BaseReactiveHandler {
    constructor(
        protected readonly _isReadonly = false,
        protected readonly _isShallow = false
    ) {}

    get(target, key, receiver) {
        const shallow = this._isShallow;
        if (key === ReactiveFlags.RAW) {
            if ((shallow ? shallowReactiveMap
                : reactiveMap).get(target)
            ){
                return target;
            }
            return;
        }
        const res = Reflect.get(target, key, receiver);
        
        track(target, key);

        if (this._isShallow) {
            return res;
        }
        if (isObject(res)) {
            return reactive(res);
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

export const mutableHandler = new MutableReactiveHandler();

export const shallowReactiveHandlers = new MutableReactiveHandler(true);