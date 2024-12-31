import { extend, hasOwn } from "@vue/shared";

export const publicPropertiesMap = extend({}, {
    $: (i) => i,
    $data: (i) => i.data,
    $props: (i) => i.props
})

export const PublicInstanceProxyHandlers = {
    get({_: instance}, key) {
        const {data, props} = instance;

        const publicGetter = publicPropertiesMap[key];

        if (publicGetter) {
            return publicGetter(instance);
        }

        else if (hasOwn(data, key)) {
            return data[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
    },

    set({_: instance}, key, value) {
        const {data} = instance;
        if (hasOwn(data, key)) {
            return true;
        }
    }
}