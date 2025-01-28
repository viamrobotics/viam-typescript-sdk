import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical button. */
export interface Button extends Resource {
  /** Push the button. */
  push: (extra?: Struct) => Promise<void>;
}
