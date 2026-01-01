/**
 * 路由管理器
 */
export class RouteManager {
  constructor() {
    this.currentUrl = '';
    this.observers = new Set();
    this.currentUrl = location.href;
    this.observeUrlChanges();
  }
  
  // 监听URL变化（支持SPA）
  observeUrlChanges() {
    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.onUrlChange();
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.onUrlChange();
    };
    
    // 监听 popstate
    window.addEventListener('popstate', () => this.onUrlChange());
    
    // 监听 hashchange
    window.addEventListener('hashchange', () => this.onUrlChange());
  }
  
  onUrlChange() {
    const newUrl = location.href;
    if (newUrl !== this.currentUrl) {
      this.currentUrl = newUrl;
      this.notifyObservers(newUrl);
    }
  }
  
  // 注册URL变化观察者
  onChange(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }
  
  notifyObservers(url) {
    this.observers.forEach(cb => cb(url));
  }
  
  // 匹配路由
  matchRoute(route, url = location.href) {
    const { pattern, mode = 'path' } = route;
    const testUrl = mode === 'path' ? location.pathname : url;
    
    if (typeof pattern === 'string') {
      // 支持通配符 *
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '\\?');
      return new RegExp(`^${regexPattern}$`).test(testUrl);
    }
    
    if (pattern instanceof RegExp) {
      return pattern.test(testUrl);
    }
    
    if (typeof pattern === 'function') {
      return pattern(url);
    }
    
    return false;
  }
}

export const routeManager = new RouteManager();
