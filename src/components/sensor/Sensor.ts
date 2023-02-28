import type { Extra } from '../../types';

export interface Sensor {
  /** Return the readings of a sensor. */
  getReadings(extra?: Extra): Promise<Record<string, unknown>>;
}
