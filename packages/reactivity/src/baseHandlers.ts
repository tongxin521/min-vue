import { isObject } from '../../shared/src';
import { reactive } from './reactive';
import { track, trigger } from './reactiveEffect';
export const baseHandlers = {
    get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        track(target, key);
        if (isObject(res)) {
            return reactive(res);
        }
        return res;
    },

    set(target, key, value, receiver) {
        const oldValue = target[key];
        const result = Reflect.set(target, key, value, receiver);
        if (oldValue !== value) {
            
            trigger(target, key);
        }
        
        
        return result;
    }

}