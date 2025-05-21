type Callback<T = unknown> = (args: T) => void;

/**
 * MachineConnectionEvent events are emitted by a Client's EventDispatcher when
 * connection events occur.
 */
export enum MachineConnectionEvent {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  DIAL_EVENT = 'dialing',
}

export class EventDispatcher {
  listeners: Partial<Record<string, Set<Callback>>> = {};

  on<T>(type: string, listener: Callback<T>) {
    const { listeners } = this;
    listeners[type] ??= new Set();
    listeners[type]?.add(listener as Callback);
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

  emit<T = unknown>(type: string, args: T) {
    for (const callback of this.listeners[type] ?? []) {
      callback(args);
    }
  }
}
