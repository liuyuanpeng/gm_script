// src/scripts/example-script.js
import { i18n } from '../core/i18n.js';

export const exampleScript = {
  id: 'example-script',
  name: 'Example Script',
  description: 'An example script with i18n support',
  
  defaultConfig: {
    showNotification: true,
    interval: 5000
  },
  
  setup: async (context) => {
    const t = i18n.t();
    
    if (context.config.showNotification) {
      // 使用翻译
      const message = {
        'zh-CN': '示例脚本已启动',
        'en-US': 'Example script started',
        'ja-JP': 'サンプルスクリプトが起動しました'
      };
      
      const lang = i18n.getLanguage();
      console.log(`[Example] ${message[lang] || message['en-US']}`);
    }
    
    // 监听语言变化
    context.on('language-changed', (newLang) => {
      console.log(`[Example] 语言已切换为: ${newLang}`);
      // 更新界面文本
    });
  }
};
