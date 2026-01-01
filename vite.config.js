import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.jsx',
      userscript: {
        // 基本信息
        name: 'GM_阿拉克涅',
        // namespace: 'https://your-namespace.com',
        version: '1.0.0',
        author: '熊赳赳',
        description: '多脚本重写整合，可配置加载',

        // ✅ 匹配的网站
        match: [
          'https://www.gamemale.com/*', // 特定网站
        ],

        // ✅ grant 权限声明（重要！）
        grant: [
          // 存储相关
          'GM_getValue',
          'GM_setValue',
          'GM_deleteValue',
          'GM_listValues',
          'GM_addValueChangeListener',
          'GM_removeValueChangeListener',

          // 菜单相关
          'GM_registerMenuCommand',
          'GM_unregisterMenuCommand',

          // 网络请求
          'GM_xmlhttpRequest',

          // 样式相关
          'GM_addStyle',
          'GM_getResourceText',
          'GM_getResourceURL',

          // 剪贴板
          'GM_setClipboard',

          // 标签页操作
          'GM_openInTab',

          // 通知
          'GM_notification',

          // 其他
          'unsafeWindow',
          'window.close',
          'window.focus',
          'window.onurlchange',
        ],

        // ✅ 脚本运行时机
        'run-at': 'document-idle',
        // 可选值：
        // - 'document-start': 脚本会被尽可能快地注入
        // - 'document-body': 当body元素存在时注入
        // - 'document-end': 当DOMContentLoaded事件被触发时注入
        // - 'document-idle': 当DOMContentLoaded事件被触发后注入（默认）

        // 图标
        icon: 'https://www.google.com/favicon.ico',

        // 更新地址（可选）
        // updateURL: 'https://example.com/script.meta.js',
        // downloadURL: 'https://example.com/script.user.js',
      },

      // ✅ 开发服务器配置
      server: {
        open: false,
        mountGmApi: true, // 在开发模式挂载 GM API
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/scripts': path.resolve(__dirname, './src/scripts'),
    },
  },
})
