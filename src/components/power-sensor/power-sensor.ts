import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Sensor } from '../sensor';

/** Represents any sensor that reports voltage, current, and/or power */
export interface PowerSensor extends Sensor {
  /** Get voltage in volts and a boolean indicating whether the voltage is
   * AC (true) or DC (false).
   *
   * @example
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(machine, 'my_power_sensor');
   * const [voltage, isAc] = await powerSensor.getVoltage();
   * ```
   */
  getVoltage(extra?: Struct): Promise<readonly [number, boolean]>;
  /** Get Current in amps and a boolean indicating whether the voltage is
   * AC (true) or DC (false).
   *
   * @example
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(machine, 'my_power_sensor');
   * const [current, isAc] = await powerSensor.getCurrent();
   * ```
   */
  getCurrent(extra?: Struct): Promise<readonly [number, boolean]>;
  /** Get power in watts.
   *
   * @example
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(machine, 'my_power_sensor');
   * const power = await powerSensor.getPower();
   * ```
   */
  getPower(extra?: Struct): Promise<number>;
  /** Return the readings of a sensor.
   *
   * @example
   * ```ts
   * const powerSensor = new VIAM.PowerSensorClient(machine, 'my_power_sensor');
   * const readings = await powerSensor.getReadings();
   * ```
   */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
