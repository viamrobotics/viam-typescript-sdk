import type { Resource } from '../../types';
import type { SlamPosition } from './types';

/**
 * A service that allows your robot to create a map of its surroundings and find
 * its location within that map.
 */
export interface Slam extends Resource {
  /**
   * Get the current position of the specified source component in the point
   * cloud SLAM map.
   */
  getPosition: () => Promise<SlamPosition>;

  /** Get the timestamp of the last update to the point cloud SLAM map. */
  getLatestMapInfo: () => Promise<Date>;
}
