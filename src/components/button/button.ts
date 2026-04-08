import type { JsonObject, Resource } from '../../types';

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
   *
   * For more information, see [Button
   * API](https://docs.viam.com/dev/reference/apis/components/button/#push).
   */
  push: (extra?: JsonObject) => Promise<void>;
}
