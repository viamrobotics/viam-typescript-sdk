import type { StructType } from '../../types';
import type { Sensor } from '../sensor';

export type PowerSensorReadings = {
  voltage?: number;
  current?: number;
  power?: number;
};

/** Represents any sensor that reports voltage, current, and/or power */
export interface PowerSensor extends Sensor {
  /** Get Voltage in volts */
  getVoltage(extra?: StructType): Promise<readonly [number, boolean]>;
  /** Get Current in amps */
  getCurrent(extra?: StructType): Promise<readonly [number, boolean]>;
  /** Get Power in watts */
  getPower(extra?: StructType): Promise<number>;
}
