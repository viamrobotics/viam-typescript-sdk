import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Sensor } from '../sensor';

/** Represents any sensor that reports voltage, current, and/or power */
export interface PowerSensor extends Sensor {
  /**
   * Get voltage in volts and a boolean indicating whether the voltage is AC
   * (true) or DC (false).
   *
   * @example
   *
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(
   *   machine,
   *   'my_power_sensor'
   * );
   * const [voltage, isAc] = await powerSensor.getVoltage();
   * ```
   *
   * For more information, see [Power Sensor API](https://docs.viam.com/dev/reference/apis/components/power-sensor/#getvoltage).
   */
  getVoltage(extra?: Struct): Promise<readonly [number, boolean]>;
  /**
   * Get Current in amps and a boolean indicating whether the voltage is AC
   * (true) or DC (false).
   *
   * @example
   *
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(
   *   machine,
   *   'my_power_sensor'
   * );
   * const [current, isAc] = await powerSensor.getCurrent();
   * ```
   *
   * For more information, see [Power Sensor API](https://docs.viam.com/dev/reference/apis/components/power-sensor/#getcurrent).
   */
  getCurrent(extra?: Struct): Promise<readonly [number, boolean]>;
  /**
   * Get power in watts.
   *
   * @example
   *
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(
   *   machine,
   *   'my_power_sensor'
   * );
   * const power = await powerSensor.getPower();
   * ```
   *
   * For more information, see [Power Sensor API](https://docs.viam.com/dev/reference/apis/components/power-sensor/#getpower).
   */
  getPower(extra?: Struct): Promise<number>;
  /**
   * Return the readings of a sensor.
   *
   * @example
   *
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(
   *   machine,
   *   'my_power_sensor'
   * );
   * const readings = await powerSensor.getReadings();
   * ```
   *
   * For more information, see [Power Sensor API](https://docs.viam.com/dev/reference/apis/components/power-sensor/#getreadings).
   */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
