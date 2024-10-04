import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Sensor } from '../sensor';

/** Represents any sensor that reports voltage, current, and/or power */
export interface PowerSensor extends Sensor {
  /** Get Voltage in volts and a boolean that returns true if AC */
  getVoltage(extra?: Struct): Promise<readonly [number, boolean]>;
  /** Get Current in amps and a boolean that returns true if AC */
  getCurrent(extra?: Struct): Promise<readonly [number, boolean]>;
  /** Get Power in watts */
  getPower(extra?: Struct): Promise<number>;
  /** Return the readings of a sensor. */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
