import type { Extra } from '../../types';

export interface Sensor {
  getReadings(extra?: Extra): Promise<Record<string, unknown>>;
}
