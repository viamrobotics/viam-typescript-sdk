type Callback = (args: unknown) => void;

/**
 * MachineConnectionEvent events are emitted by a Client's EventDispatcher when
 * connection events occur.
 *
 * TODO: Emit 'connecting' and 'connected' events
 */
export enum MachineConnectionEvent {
  RECONNECTED = 'reconnected',
  DISCONNECTED = 'disconnected',
}

export class EventDispatcher {
  listeners: Partial<Record<string, Set<Callback>>> = {};

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
