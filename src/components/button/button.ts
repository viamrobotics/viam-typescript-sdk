import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical button. */
export interface Button extends Resource {
  /**
   * Push the button.
   *
   * @example
   *
   * ```ts
   * const button = new VIAM.ButtonClient(machine, 'my_button');
   *
   * // Push the button
   * await button.push();
   * ```
   */
  push: (extra?: Struct) => Promise<void>;
}
