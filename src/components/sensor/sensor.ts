import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical sensing device that can provide measurement readings. */
export interface Sensor extends Resource {
  /** Return the readings of a sensor. */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
