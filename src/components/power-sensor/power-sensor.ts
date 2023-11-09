import type { StructType } from '../../types';
import type { Sensor } from '../sensor';

/** Represents any sensor that reports voltage, current, and/or power */
export interface PowerSensor extends Sensor {
  /** Get Voltage in volts and a boolean that returns true if AC */
  getVoltage(extra?: StructType): Promise<readonly [number, boolean]>;
  /** Get Current in amps and a boolean that returns true if AC */
  getCurrent(extra?: StructType): Promise<readonly [number, boolean]>;
  /** Get Power in watts */
  getPower(extra?: StructType): Promise<number>;
  /** Return the readings of a sensor. */
  getReadings(extra?: StructType): Promise<Record<string, unknown>>;
}
