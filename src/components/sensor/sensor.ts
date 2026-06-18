import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { Geometry } from '../../gen/common/v1/common_pb';

/** Represents a physical sensing device that can provide measurement readings. */
export interface Sensor extends Resource {
  /**
   * Get the geometries of the component in their current configuration.
   *
   * @example
   *
   * ```ts
   * const sensor = new VIAM.SensorClient(machine, 'my_sensor');
   * const geometries = await sensor.getGeometries();
   * ```
   *
   * For more information, see [Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/sensor/#getgeometries).
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

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
   * For more information, see [Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/sensor/#getreadings).
   */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
