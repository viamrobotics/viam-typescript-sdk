type Callback = (args: unknown) => void;

export const RECONNECTED = 'reconnected';
export const DISCONNECTED = 'disconnected';

export class EventDispatcher {
  listeners: Record<string, Set<Callback>> = {};

  on(type: string, listener: Callback) {
    const { listeners } = this;
    listeners[type] ??= new Set();
    listeners[type]?.add(listener);
  }

  once(type: string, listener: Callback) {
    const fn = (args: unknown) => {
      listener(args);
      this.off(type, listener);
    };
    this.on(type, fn);
  }

  has(type: string, listener: Callback) {
    return this.listeners[type]?.has(listener);
  }

  off(type: string, listener: Callback) {
    this.listeners[type]?.delete(listener);
  }

  emit(type: string, args: unknown) {
    for (const callback of this.listeners[type] ?? []) {
      callback(args);
    }
  }
}

export const events = new EventDispatcher();
