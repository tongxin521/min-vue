import { createRenderer } from "@vue/runtime-core";
import { patchProp } from "./patchProp";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";

const rendererOptions = extend({patchProp}, nodeOps);

export function render() {
    return createRenderer(rendererOptions).render;
}