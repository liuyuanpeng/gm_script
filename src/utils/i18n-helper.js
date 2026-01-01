// src/utils/i18n-helper.js
import { i18n } from '../core/i18n.js';

/**
 * 创建多语言脚本配置
 */
export function createI18nScript(config) {
  return {
    id: config.id,
    
    get name() {
      const lang = i18n.getLanguage();
      return config.names[lang] || config.names['en-US'];
    },
    
    get description() {
      const lang = i18n.getLanguage();
      return config.descriptions[lang] || config.descriptions['en-US'];
    },
    
    routes: config.routes,
    defaultConfig: config.defaultConfig,
    
    getConfigLabel(key) {
      const lang = i18n.getLanguage();
      return config.configLabels[key]?.[lang] || key;
    },
    
    setup: config.setup,
    cleanup: config.cleanup
  };
}
