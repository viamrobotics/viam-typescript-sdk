export interface Stream {
  /** Add a stream by name. */
  add: (name: string) => Promise<void>;
  /** Remove a stream by name. */
  remove: (name: string) => Promise<void>;
}
