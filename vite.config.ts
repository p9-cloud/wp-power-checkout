import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {api: 'modern-compiler'},
        }
    },
    plugins: [
        vue(),
        vueDevTools()
    ],
    build: {
        outDir: 'js/dist',
        rollupOptions: {
            input: 'js/src/main.ts',
            output: {
                entryFileNames: 'main.js',
                format: 'iife',
                name: 'settings'
            }
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./js/src', import.meta.url))
        },
    },
})