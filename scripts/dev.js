import { createRequire } from 'node:module';
import {parseArgs} from 'node:util';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from "esbuild";

const require = createRequire(import.meta.url)
// 获取命令行参数
const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
        format: {
            type: 'string',
            short: 'f',
            default: 'global',
        }
    }
})

// 获取文件的绝对路径
const __dirname = dirname(fileURLToPath(import.meta.url))
console.log(values, 'values');
const outputFormat = values.format === 'global' ? 'iife' : values.format;

const target = positionals[0] || 'reactivity';

const enter = resolve(__dirname, `../packages/${target}/src/index.js`);
const outfile = resolve(
    __dirname,
    `../packages/${target}/dist/${target}.js`,
);

const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

console.log(outfile, outputFormat);

esbuild.context({
    entryPoints: [enter],
    outfile,
    format: outputFormat,
    bundle: true,
    platform: "browser", // 打包后给浏览器使用
    sourcemap: true,
    external: ['vue'],
    globalName: pkg.buildOptions?.name,
})
.then((ctx) => {
   return ctx.watch();
})



