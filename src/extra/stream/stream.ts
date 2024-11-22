import { Resolution } from '../../gen/stream/v1/stream_pb';

export interface Stream {
  /** Add a stream by name. */
  add: (name: string) => Promise<void>;
  /** Remove a stream by name. */
  remove: (name: string) => Promise<void>;
  /** Get stream options by name. */
  getOptions: (resourceName: string) => Promise<Resolution[]>;
  /** Set stream options by name and resolution */
  setOptions: (name: string, width: number, height: number) => Promise<void>;
  /** Reset stream options by name */
  resetOptions: (name: string) => Promise<void>;
}
