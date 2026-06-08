type Callback<E> = (args: E) => void;

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

export class EventDispatcher<Events extends object> {
  listeners: Partial<{ [K in keyof Events]: Set<Callback<Events[K]>> }> = {};

  on<K extends keyof Events & string>(type: K, listener: Callback<Events[K]>): void {
    this.listeners[type] ??= new Set<Callback<Events[K]>>();
    this.listeners[type].add(listener);
  }

  once<K extends keyof Events & string>(type: K, listener: Callback<Events[K]>): void {
    const fn = (args: Events[K]) => {
      listener(args);
      this.off(type, fn);
    };
    this.on(type, fn);
  }

  has<K extends keyof Events & string>(
    type: K,
    listener: Callback<Events[K]>,
  ): boolean | undefined {
    return this.listeners[type]?.has(listener);
  }

  off<K extends keyof Events & string>(type: K, listener: Callback<Events[K]>): void {
    this.listeners[type]?.delete(listener);
  }

  emit<K extends keyof Events & string>(type: K, args: Events[K]): void {
    for (const callback of this.listeners[type] ?? []) {
      callback(args);
    }
  }
}
