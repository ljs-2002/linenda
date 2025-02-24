import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import Pages from 'vite-plugin-pages'
import viteCompression from 'vite-plugin-compression'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@resources': resolve('resources')
      }
    },
    plugins: [
      vue(),
      Pages({
        // 自动生成路由，并启用代码分割
        importMode: 'async'
      }),
      viteCompression({
        algorithm: 'gzip', // 使用 gzip 压缩
        ext: '.gz' // 生成 .gz 文件
      })
    ],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: true, // 启用压缩
        mangle: true, // 启用变量名混淆
        keep_classnames: false, // 不保留类名
        keep_fnames: false // 不保留函数名
      },
      manualChunks: {
        // 将第三方库分块打包
        'element-plus': ['element-plus'],
        fullcalendar: [
          '@fullcalendar/core',
          '@fullcalendar/daygrid',
          '@fullcalendar/timegrid',
          '@fullcalendar/list',
          '@fullcalendar/interaction'
        ],
        fontawesome: [
          '@fortawesome/fontawesome-svg-core',
          '@fortawesome/free-solid-svg-icons',
          '@fortawesome/vue-fontawesome'
        ]
      },
      rollupOptions: {
        output: {
          // 自定义chunk文件名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames(assetInfo) {
            // 使用 fileName 替代 name
            if (assetInfo.fileName?.endsWith('.css')) {
              return `css/[name]-[hash][extname]`
            }
            const imgExts = ['.png', '.jpeg', '.jpg', '.gif', '.svg', '.ico', '.webp']
            if (imgExts.some((ext) => assetInfo.fileName?.endsWith(ext))) {
              return `images/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
        },
        treeshake: {
          preset: 'smallest',
          propertyReadSideEffects: false,
          moduleSideEffects: false,
          tryCatchDeoptimization: false,
          correctVarValueBeforeDeclaration: false
        }
      },
      cssCodeSplit: true, //分隔css
      sourcemap: false // 禁用 sourcemap
    }
  }
})
