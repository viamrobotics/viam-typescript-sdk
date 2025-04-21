import type { Struct } from '@bufbuild/protobuf';
import type { GeoGeometry, GeoPoint, Resource } from '../../types';
import type {
  Mode,
  NavigationPosition,
  NavigationProperties,
  Path,
  Waypoint,
} from './types';

/**
 * A service that uses GPS to automatically navigate a robot to user defined
 * endpoints.
 *
 * @example
 *
 * ```ts
 * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
 *
 * const mode = await navigation.getMode();
 * ```
 *
 * For more information, see [Navigation
 * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getmode).
 */
export interface Navigation extends Resource {
  /** Get the mode the robot is operating in.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const mode = await navigation.getMode();
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getmode).
   */
  getMode: (extra?: Struct) => Promise<Mode>;

  /**
   * Set the mode the robot is operating in.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * // Set the mode to 2 which corresponds to WAYPOINT
   * await navigation.setMode(2);
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#setmode).
   *
   * @param mode - The mode for the service to operate in.
   *   - 0: MODE_UNSPECIFIED
   *   - 1: MODE_MANUAL
   *   - 2: MODE_WAYPOINT
   *   - 3: MODE_EXPLORE
   */
  setMode: (mode: Mode, extra?: Struct) => Promise<void>;

  /** Get the current location of the robot.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const location = await navigation.getLocation();
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getlocation).
   */
  getLocation: (extra?: Struct) => Promise<NavigationPosition>;

  /** Get an array of waypoints currently in the service's data storage.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const waypoints = await navigation.getWayPoints();
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getwaypoints).
   */
  getWayPoints: (extra?: Struct) => Promise<Waypoint[]>;

  /**
   * Add a waypoint to the service's data storage.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const location = { latitude: 40.7128, longitude: -74.006 };
   * await navigation.addWayPoint(location);
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#addwaypoint).
   *
   * @param location - A waypoint described by latitude and longitude values.
   * */
  addWayPoint: (location: GeoPoint, extra?: Struct) => Promise<void>;

  /**
   * Remove a waypoint from the service's data storage.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * // Remove the first waypoint
   * if (waypoints.length > 0) {
   *   await navigation.removeWayPoint(waypoints[0].id);
   * }
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#removewaypoint).
   *
   * @param id - The MongoDB ObjectID of the waypoint to remove from the
   *   service's data storage.
   */
  removeWayPoint: (id: string, extra?: Struct) => Promise<void>;

  /**
   * Get a list of obstacles.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const obstacles = await navigation.getObstacles();
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getobstacles).
   */
  getObstacles: (extra?: Struct) => Promise<GeoGeometry[]>;

  /**
   * Gets the list of paths known to the navigation service.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const paths = await navigation.getPaths();
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getpaths).
   */
  getPaths: (extra?: Struct) => Promise<Path[]>;

  /**
   * Gets information on the properties of the current navigation service.
   *
   * @example
   *
   * ```ts
   * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
   *
   * const properties = await navigation.getProperties();
   * ```
   *
   * For more information, see [Navigation
   * API](https://docs.viam.com/dev/reference/apis/services/navigation/#getproperties).
   */
  getProperties: () => Promise<NavigationProperties>;
}
