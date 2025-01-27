import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical switch with multiple positions. */
export interface Switch extends Resource {
  /** Set the switch to a specific position. */
  setPosition: (position: number, extra?: Struct) => Promise<void>;

  /** Get the current position of the switch. */
  getPosition: (extra?: Struct) => Promise<number>;

  /** Get the total number of positions available on the switch. */
  getNumberOfPositions: (extra?: Struct) => Promise<number>;
} 