import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical sensing device that can provide measurement readings. */
export interface Sensor extends Resource {
  /**
   * Return the readings of a sensor.
   *
   * @example
   *
   * ```ts
   * const sensor = new VIAM.SensorClient(machine, 'my_sensor');
   *
   * // Get the readings of a sensor.
   * const readings = await sensor.getReadings();
   * ```
   *
   * For more information, see [Sensor API](https://docs.viam.com/dev/reference/apis/components/sensor/#getreadings).
   */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
