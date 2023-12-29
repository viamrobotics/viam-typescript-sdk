import type { Resource } from '../../types';
import type { SlamPosition, SlamProperties } from './types';

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

  /** Get the point cloud SLAM map. */
  getPointCloudMap: () => Promise<Uint8Array>;

  /**
   * Get the internal state of the SLAM algorithm required to continue
   * mapping/localization.
   */
  getInternalState: () => Promise<Uint8Array>;

  /** Gets information on the properties of the current SLAM service. */
  getProperties: () => Promise<SlamProperties>;
}
