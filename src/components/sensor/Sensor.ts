import type { Extra } from '../../types';

/** Represents a physical sensing device that can provide measurement readings. */
export interface Sensor {
  /** Return the readings of a sensor. */
  getReadings(extra?: Extra): Promise<Record<string, unknown>>;
}
