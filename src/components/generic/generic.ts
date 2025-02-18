import type { Geometry } from '../../gen/common/v1/common_pb';
import type { Struct, Resource } from '../../types';

/** Represents a generic component. */
export interface Generic extends Resource {
  /** Get the geometries of the component in their current configuration */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;
}
