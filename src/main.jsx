// src/main.js
import { scriptManager } from './core/ScriptManager.js';
import { configPanelManager } from './core/ConfigPanelManager.js';
import { i18n } from './core/i18n.js';
import { allScripts } from './scripts/index.js';

console.log('[Main] 🕷️ Arachne 启动中...');

// 批量注册脚本
scriptManager.registerAll(allScripts);

// 初始化
scriptManager.initialize();

// 注册配置菜单
if (typeof GM_registerMenuCommand !== 'undefined') {
  const t = i18n.t();
  GM_registerMenuCommand(`⚙️ ${t.configPanel.title}`, () => {
    configPanelManager.toggle();
  });
} else {
  console.warn('[Main] GM_registerMenuCommand 不可用');
  
  // 开发环境：使用快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      configPanelManager.toggle();
    }
  });
  
  console.log('[Main] 开发模式：按 Ctrl+Shift+C 切换配置面板');
}

console.log(`[Main] ✓ Arachne 已就绪 (语言: ${i18n.getLanguage()})`);
