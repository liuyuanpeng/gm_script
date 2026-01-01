// src/core/i18n.js

import { aiReply } from '../scripts/aiReply';

const translations = {
  'zh-CN': {
    configPanel: {
      title: '脚本配置',
      close: '关闭',
      save: '保存',
      reset: '重置',
      language: '语言设置'
    },
    script: {
      enabled: '已启用',
      disabled: '已禁用',
      enable: '启用',
      disable: '禁用',
      config: '配置项',
      description: '描述',
      route: '路由匹配',
      global: '全局',
      defaultGlobal: '默认全局'
    },
    config: {
      title: '配置选项',
      noConfig: '该脚本无配置项',
      booleanTrue: '是',
      booleanFalse: '否'
    },
    message: {
      saved: '✓ 配置已保存',
      needReload: '需要刷新页面以应用更改',
      confirmReload: '是否立即刷新？',
      enableScript: '已启用脚本',
      disableScript: '已禁用脚本',
      hasUnsaved: '有未保存的更改', // ✅ 新增
      confirmDiscard: '确定放弃所有未保存的更改吗？' // ✅ 新增
    },
    common: {
      confirm: '确认',
      cancel: '取消',
      yes: '是',
      no: '否',
      about: '关于', // ✅ 新增
      currentLanguage: '当前语言' // ✅ 新增
    },
    scripts: {
      homeScript: {
        name: '首页脚本',
        description: '签到、抽奖、清空奇怪的消息',
        configs: {
          enableSignIn: '启用签到',
          enableLottery: '启用抽奖',
          enableClearNotifications: '启用清空奇怪的提醒'
        }
      },
      aiReply: {
        name: 'AI回帖',
        description: '使用AI进行回帖编辑'
      }
    }
  },
};



class I18n {
  constructor() {
    this.STORAGE_KEY = 'arachne_language';
    this.currentLanguage = this.loadLanguage();
  }
  
  loadLanguage() {
    // 从存储读取
    const saved = GM_getValue(this.STORAGE_KEY);
    if (saved && translations[saved]) {
      return saved;
    }
    
    // 从浏览器语言检测
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) return 'zh-CN';
    if (browserLang.startsWith('en')) return 'en-US';
    
    // 默认英文
    return 'en-US';
  }
  
  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`[i18n] Language ${lang} not supported`);
      return;
    }
    
    this.currentLanguage = lang;
    GM_setValue(this.STORAGE_KEY, lang);
  }
  
  getLanguage() {
    return this.currentLanguage;
  }
  
  t() {
    return translations[this.currentLanguage];
  }
  
  getAvailableLanguages() {
    return [
      { code: 'zh-CN', name: '简体中文' },
      { code: 'en-US', name: 'English' }
    ];
  }
}

// 导出单例
const i18n = new I18n();
export { i18n };
