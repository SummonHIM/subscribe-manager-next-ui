import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import Pages from 'vite-plugin-pages'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    Components({ resolvers: [PrimeVueResolver()] }),
    Pages({ dirs: 'src/views' }),
    tailwindcss(),
    vitePluginBundleObfuscator(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // setupFiles: './test/setup.ts', // 可选：全局初始化
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/oidc': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
