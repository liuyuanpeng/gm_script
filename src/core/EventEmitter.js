/**
 * 事件总线
 */
export class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);
  }
  
  off(event, handler) {
    this.events.get(event)?.delete(handler);
  }
  
  emit(event, data) {
    this.events.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[EventEmitter] Error in handler for ${event}:`, error);
      }
    });
  }
  
  clear() {
    this.events.clear();
  }
}
