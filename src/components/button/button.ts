import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical button. */
export interface Button extends Resource {
  /** Press the button. */
  press: (extra?: Struct) => Promise<void>;
}
