import { resolve } from 'path'

import vue from '@vitejs/plugin-vue'
import { defineConfig, normalizePath } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Must match node-red-dashboard-2.widgets[<key>] and "output" in package.json
const LIBRARY_NAME = 'ui-header'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        cssInjectedByJsPlugin(),
        viteStaticCopy({
            targets: [
                {
                    // Copy the build output into Node-RED's /resources folder
                    src: normalizePath(resolve(__dirname, `./ui/dist/${LIBRARY_NAME}.umd.js`)),
                    dest: normalizePath(resolve(__dirname, 'resources'))
                }
            ]
        })
    ],
    build: {
        // Generate a source map in dev mode
        sourcemap: process.env.NODE_ENV === 'development',
        // Configure build as a UMD library
        lib: {
            entry: resolve(__dirname, 'ui/index.js'),
            name: LIBRARY_NAME,
            formats: ['umd'],
            fileName: (format) => `${LIBRARY_NAME}.${format}.js`
        },
        outDir: './ui/dist',
        rollupOptions: {
            // Don't bundle Vue / Vuex - Dashboard provides them at runtime
            external: ['vue', 'vuex'],
            output: {
                globals: {
                    vue: 'Vue',
                    vuex: 'vuex'
                }
            }
        }
    }
})
