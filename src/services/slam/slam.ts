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
   *
   * @example
   *
   * ```ts
   * const slam = new VIAM.SlamClient(machine, 'my_slam');
   *
   * // Get the current position of the robot in the SLAM map
   * const position = await slam.getPosition();
   * console.log('Current position:', position);
   * ```
   *
   * For more information, see [SLAM
   * API](https://docs.viam.com/dev/reference/apis/services/slam/#getposition).
   */
  getPosition: () => Promise<SlamPosition>;

  /**
   * Get the point cloud SLAM map.
   *
   * @example
   *
   * ```ts
   * const slam = new VIAM.SlamClient(machine, 'my_slam');
   *
   * // Get the point cloud map
   * const pointCloudMap = await slam.getPointCloudMap();
   *
   * // Get the edited point cloud map
   * const editedMap = await slam.getPointCloudMap(true);
   * ```
   *
   * For more information, see [SLAM
   * API](https://docs.viam.com/dev/reference/apis/services/slam/#getpointcloudmap).
   */
  getPointCloudMap: (returnEditedMap?: boolean) => Promise<Uint8Array>;

  /**
   * Get the internal state of the SLAM algorithm required to continue
   * mapping/localization.
   *
   * @example
   *
   * ```ts
   * const slam = new VIAM.SlamClient(machine, 'my_slam');
   *
   * // Get the internal state of the SLAM algorithm
   * const internalState = await slam.getInternalState();
   * ```
   *
   * For more information, see [SLAM
   * API](https://docs.viam.com/dev/reference/apis/services/slam/#getinternalstate).
   */
  getInternalState: () => Promise<Uint8Array>;

  /**
   * Get information on the properties of the current SLAM service.
   *
   * @example
   *
   * ```ts
   * const slam = new VIAM.SlamClient(machine, 'my_slam');
   *
   * // Get the properties of the SLAM service
   * const properties = await slam.getProperties();
   * console.log('SLAM properties:', properties);
   * ```
   *
   * For more information, see [SLAM
   * API](https://docs.viam.com/dev/reference/apis/services/slam/#getproperties).
   */
  getProperties: () => Promise<SlamProperties>;
}
