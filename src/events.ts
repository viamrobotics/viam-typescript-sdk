type Callback<T> = (args: T) => void;

/**
 * MachineConnectionEvent events are emitted by a Client's EventDispatcher when connection events
 * occur.
 */
export enum MachineConnectionEvent {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  DIALING = 'dialing',
  RECONNECTING = 'reconnecting',
  RECONNECTION_FAILED = 'reconnection_failed',
}

export class EventDispatcher<T> {
  listeners: Partial<Record<string, Set<Callback<T>>>> = {};

  on(type: string, listener: Callback<T>) {
    const { listeners } = this;
    listeners[type] ??= new Set();
    listeners[type].add(listener);
  }

  once(type: string, listener: Callback<T>) {
    const fn = (args: T) => {
      listener(args);
      this.off(type, listener);
    };
    this.on(type, fn);
  }

  has(type: string, listener: Callback<T>) {
    return this.listeners[type]?.has(listener);
  }

  off(type: string, listener: Callback<T>) {
    this.listeners[type]?.delete(listener);
  }

  emit(type: string, args: T) {
    for (const callback of this.listeners[type] ?? []) {
      callback(args);
    }
  }
}
