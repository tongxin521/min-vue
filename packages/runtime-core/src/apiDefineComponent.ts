import { extend, isFunction } from "@vue/shared";

export function defineComponent(options, extraOptions?) {
    return isFunction(options) ? () => extend({name: options.name}, extraOptions, {setup: options})() : options;
}