// src/components/ConfigPanel.js
import { scriptManager } from '../core/ScriptManager.js';
import { i18n } from '../core/i18n.js';
import './ConfigPanel.css'

export class ConfigPanel {
  constructor() {
    this.activeTab = 'scripts';
    this.container = null;
    this.onCloseCallback = null;
    this.hasUnsavedChanges = false; // ✅ 追踪是否有未保存的更改
    this.pendingChanges = new Map(); // ✅ 暂存待保存的更改
  }
  
  create(onClose) {
    this.onCloseCallback = onClose;
    
    this.container = document.createElement('div');
    this.container.id = 'arachne-config-panel';
    this.container.className = 'config-panel-overlay';
    
    this.render();
    this.attachEvents();
    
    return this.container;
  }
  
  render() {
    const t = i18n.t();
    
    this.container.innerHTML = `
      <div class="config-panel" id="config-panel-content">
        ${this.renderHeader()}
        ${this.renderTabs()}
        ${this.renderContent()}
        ${this.renderFooter()}
      </div>
    `;
  }
  
  renderHeader() {
    const t = i18n.t();
    return `
      <div class="config-header">
        <h2>🕷️ ${t.configPanel.title}</h2>
        <button class="close-btn" id="config-close-btn">✕</button>
      </div>
    `;
  }
  
  renderTabs() {
    const t = i18n.t();
    return `
      <div class="config-tabs">
        <button class="tab ${this.activeTab === 'scripts' ? 'active' : ''}" data-tab="scripts">
          ${t.script.config}
        </button>
        <button class="tab ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
          ${t.configPanel.language}
        </button>
      </div>
    `;
  }
  
  renderContent() {
    return `
      <div class="config-content">
        ${this.activeTab === 'scripts' ? this.renderScriptsTab() : this.renderSettingsTab()}
      </div>
    `;
  }
  
  // ✅ 新增：渲染底部按钮栏
  renderFooter() {
    const t = i18n.t();
    return `
      <div class="config-footer">
        <div class="footer-info">
          ${this.hasUnsavedChanges ? `
            <span class="unsaved-indicator">⚠️ ${t.message.hasUnsaved || '有未保存的更改'}</span>
          ` : ''}
        </div>
        <div class="footer-actions">
          <button class="btn-secondary" id="config-cancel-btn">
            ${t.common.cancel}
          </button>
          <button 
            class="btn-primary" 
            id="config-save-btn"
            ${!this.hasUnsavedChanges ? 'disabled' : ''}
          >
            ${t.configPanel.save}
          </button>
        </div>
      </div>
    `;
  }
  
  renderScriptsTab() {
    const t = i18n.t();
    const scripts = Array.from(scriptManager.getAllScripts().entries());
    
    if (scripts.length === 0) {
      return `
        <div class="config-empty">
          <h3>${t.config.noConfig}</h3>
        </div>
      `;
    }
    
    return `
      <div class="config-list">
        ${scripts.map(([id, script]) => this.renderScriptItem(id, script)).join('')}
      </div>
    `;
  }
  
  renderScriptItem(id, script) {
    const t = i18n.t();
    const config = scriptManager.getConfig(id);
    const hasConfig = Object.keys(script.defaultConfig).length > 0;
    
    return `
      <div class="config-item" data-script-id="${id}">
        <div class="script-header">
          <div class="script-title">
            <h3>${this.escapeHtml(script.name)}</h3>
            ${this.renderRouteInfo(script)}
          </div>
          <label class="script-toggle">
            <input 
              type="checkbox" 
              ${config.enabled ? 'checked' : ''} 
              data-action="toggle-script"
              data-script-id="${id}"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <p class="script-description">${this.escapeHtml(script.description)}</p>
        
        ${config.enabled && hasConfig ? `
          <div class="script-config">
            <h4>${t.config.title}</h4>
            ${Object.entries(script.defaultConfig).map(([key, value]) => 
              this.renderConfigField(id, key, value, config.config[key] ?? value)
            ).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderRouteInfo(script) {
    const t = i18n.t();
    
    if (script.global) {
      return `<span class="route-badge global">${t.script.global}</span>`;
    }
    
    if (!script.routes || script.routes.length === 0) {
      return `<span class="route-badge default">${t.script.defaultGlobal}</span>`;
    }
    
    return `
      <div class="route-list">
        ${script.routes.map(route => {
          const pattern = typeof route.pattern === 'string' 
            ? this.escapeHtml(route.pattern)
            : route.pattern instanceof RegExp 
            ? this.escapeHtml(route.pattern.toString())
            : t.script.route;
          return `<span class="route-badge">${pattern}</span>`;
        }).join('')}
      </div>
    `;
  }
  
  renderConfigField(scriptId, key, defaultValue, currentValue) {
    const t = i18n.t();
    const script = scriptManager.getAllScripts().get(scriptId);
    
    let label = key;
    if (script && typeof script.getConfigLabel === 'function') {
      label = script.getConfigLabel(key);
    }
    
    const safeKey = this.escapeHtml(key);
    const safeLabel = this.escapeHtml(label);
    
    if (typeof defaultValue === 'boolean') {
      return `
        <div class="config-field">
          <label class="config-checkbox">
            <input 
              type="checkbox" 
              ${currentValue ? 'checked' : ''}
              data-action="change-config"
              data-script-id="${scriptId}"
              data-config-key="${key}"
            />
            <span>${safeLabel}</span>
            <span class="checkbox-label">
              ${currentValue ? t.config.booleanTrue : t.config.booleanFalse}
            </span>
          </label>
        </div>
      `;
    }
    
    if (typeof defaultValue === 'number') {
      return `
        <div class="config-field">
          <label class="config-input">
            <span>${safeLabel}</span>
            <input 
              type="number" 
              value="${currentValue}"
              data-action="change-config"
              data-script-id="${scriptId}"
              data-config-key="${key}"
            />
          </label>
        </div>
      `;
    }
    
    return `
      <div class="config-field">
        <label class="config-input">
          <span>${safeLabel}</span>
          <input 
            type="text" 
            value="${this.escapeHtml(String(currentValue))}"
            data-action="change-config"
            data-script-id="${scriptId}"
            data-config-key="${key}"
          />
        </label>
      </div>
    `;
  }
  
  renderSettingsTab() {
    const t = i18n.t();
    const currentLang = i18n.getLanguage();
    const languages = i18n.getAvailableLanguages();
    
    return `
      <div class="settings-panel">
        <div class="setting-section">
          <h3>${t.configPanel.language}</h3>
          <div class="language-selector">
            ${languages.map(lang => `
              <label class="language-option">
                <input 
                  type="radio" 
                  name="language" 
                  value="${lang.code}"
                  ${currentLang === lang.code ? 'checked' : ''}
                  data-action="change-language"
                />
                <span>${this.escapeHtml(lang.name)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="setting-section">
          <h3>ℹ️ ${t.common.about || '关于'}</h3>
          <div class="info-text">
            <p>🕷️ <strong>GM_阿拉克捏</strong> v1.0.0</p>
            <p>${t.common.currentLanguage || '当前语言'}: ${this.escapeHtml(currentLang)}</p>
          </div>
        </div>
      </div>
    `;
  }
  
  attachEvents() {
    // 关闭按钮
    const closeBtn = this.container.querySelector('#config-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleClose());
    }
    
    // ✅ 取消按钮
    const cancelBtn = this.container.querySelector('#config-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }
    
    // ✅ 保存按钮
    const saveBtn = this.container.querySelector('#config-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave());
    }
    
    // 点击背景关闭
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.handleClose();
      }
    });
    
    // 阻止面板内部点击冒泡
    const panel = this.container.querySelector('.config-panel');
    if (panel) {
      panel.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // 标签页切换
    this.container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeTab = e.target.dataset.tab;
        this.render();
        this.attachEvents();
      });
    });
    
    // 委托事件处理
    this.container.addEventListener('change', (e) => {
      this.handleChange(e);
    });
    
    this.container.addEventListener('input', (e) => {
      if (e.target.type === 'text' || e.target.type === 'number') {
        this.handleChange(e);
      }
    });
  }
  
  handleChange(e) {
    const action = e.target.dataset.action;
    
    if (action === 'toggle-script') {
      this.handleToggleScript(e.target.dataset.scriptId, e.target.checked);
    } else if (action === 'change-config') {
      this.handleChangeConfig(
        e.target.dataset.scriptId,
        e.target.dataset.configKey,
        e.target.type === 'checkbox' ? e.target.checked : e.target.value
      );
    } else if (action === 'change-language') {
      this.handleChangeLanguage(e.target.value);
    }
  }
  
  // ✅ 修改：暂存脚本启用/禁用状态
  handleToggleScript(scriptId, enabled) {
    const config = scriptManager.getConfig(scriptId);
    
    // 暂存更改
    if (!this.pendingChanges.has(scriptId)) {
      this.pendingChanges.set(scriptId, { ...config });
    }
    
    const pending = this.pendingChanges.get(scriptId);
    pending.enabled = enabled;
    
    this.hasUnsavedChanges = true;
    this.updateFooter();
    
    console.log(`[ConfigPanel] 暂存: ${scriptId}.enabled = ${enabled}`);
  }
  
  // ✅ 修改：暂存配置更改
  handleChangeConfig(scriptId, key, value) {
    const config = scriptManager.getConfig(scriptId);
    const currentConfig = config.config[key];
    
    // 转换值类型
    let newValue = value;
    if (typeof currentConfig === 'number') {
      newValue = Number(value);
    } else if (typeof currentConfig === 'boolean') {
      newValue = Boolean(value);
    }
    
    // 暂存更改
    if (!this.pendingChanges.has(scriptId)) {
      this.pendingChanges.set(scriptId, { ...config, config: { ...config.config } });
    }
    
    const pending = this.pendingChanges.get(scriptId);
    if (!pending.config) {
      pending.config = { ...config.config };
    }
    pending.config[key] = newValue;
    
    this.hasUnsavedChanges = true;
    this.updateFooter();
    
    console.log(`[ConfigPanel] 暂存: ${scriptId}.${key} = ${newValue}`);
  }
  
  handleChangeLanguage(langCode) {
    i18n.setLanguage(langCode);
    console.log(`[ConfigPanel] 语言已切换: ${langCode}`);
    
    this.render();
    this.attachEvents();
  }
  
  // ✅ 新增：保存所有更改
  handleSave() {
    const t = i18n.t();
    
    if (!this.hasUnsavedChanges || this.pendingChanges.size === 0) {
      return;
    }
    
    console.log('[ConfigPanel] 保存所有更改...');
    
    // 应用所有暂存的更改
    this.pendingChanges.forEach((changes, scriptId) => {
      scriptManager.saveConfig(scriptId, changes);
      console.log(`[ConfigPanel] 已保存: ${scriptId}`, changes);
    });
    
    // 清空暂存
    this.pendingChanges.clear();
    this.hasUnsavedChanges = false;
    
    // 提示用户
    const message = `${t.message.saved}\n\n${t.message.needReload}\n${t.message.confirmReload}`;
    
    if (confirm(message)) {
      location.reload();
    } else {
      this.handleClose();
    }
  }
  
    // ✅ 新增：取消更改
  handleCancel() {
    const t = i18n.t();
    
    if (this.hasUnsavedChanges) {
      const message = t.message?.confirmDiscard || '确定放弃所有未保存的更改吗？';
      if (!confirm(message)) {
        return;
      }
    }
    
    // 清空暂存的更改
    this.pendingChanges.clear();
    this.hasUnsavedChanges = false;
    
    console.log('[ConfigPanel] 已取消所有更改');
    this.handleClose();
  }
  
  handleClose() {
    if (this.hasUnsavedChanges) {
      const t = i18n.t();
      const message = t.message?.confirmDiscard || '有未保存的更改，确定要关闭吗？';
      if (!confirm(message)) {
        return;
      }
    }
    
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
  
  // ✅ 更新底部按钮状态
  updateFooter() {
    const footer = this.container.querySelector('.config-footer');
    if (footer) {
      const t = i18n.t();
      footer.innerHTML = `
        <div class="footer-info">
          ${this.hasUnsavedChanges ? `
            <span class="unsaved-indicator">⚠️ ${t.message?.hasUnsaved || '有未保存的更改'}</span>
          ` : ''}
        </div>
        <div class="footer-actions">
          <button class="btn-secondary" id="config-cancel-btn">
            ${t.common.cancel}
          </button>
          <button 
            class="btn-primary" 
            id="config-save-btn"
            ${!this.hasUnsavedChanges ? 'disabled' : ''}
          >
            ${t.configPanel.save}
          </button>
        </div>
      `;
      
      // 重新绑定按钮事件
      const cancelBtn = footer.querySelector('#config-cancel-btn');
      const saveBtn = footer.querySelector('#config-save-btn');
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.handleCancel());
      }
      
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.handleSave());
      }
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
    this.container = null;
    this.onCloseCallback = null;
    this.pendingChanges.clear();
  }
}

