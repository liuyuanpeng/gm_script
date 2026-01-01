import { ConfigPanel } from '@/components/ConfigPanel';

class ConfigPanelManager {
  constructor() {
    this.isOpen = false;
    this.panel = null;
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    if (this.isOpen) return;
    
    this.panel = new ConfigPanel();
    const container = this.panel.create(() => this.close());
    document.body.appendChild(container);
    
    this.isOpen = true;
    console.log('[ConfigPanelManager] 配置面板已打开');
  }
  
  close() {
    if (!this.isOpen) return;
    
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
      this.isOpen = false;
    }
    console.log('[ConfigPanelManager] 配置面板已关闭');
  }
  
  isOpened() {
    return this.isOpen;
  }
}

// 导出单例
const configPanelManager = new ConfigPanelManager();
export { configPanelManager };
