import type { Geometry } from '../../gen/common/v1/common_pb';
import type { Struct, Resource } from '../../types';

/** Represents a generic component. */
export interface Generic extends Resource {
  /**
   * Get the geometries of the component in their current configuration.
   *
   * @example
   *
   * ```ts
   * const generic = new VIAM.GenericComponentClient(
   *   machine,
   *   'my_generic_component'
   * );
   *
   * // Get the geometries of this component
   * const geometries = await generic.getGeometries();
   * console.log('Geometries:', geometries);
   * ```
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;
}
