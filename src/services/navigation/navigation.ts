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
 */
export interface Navigation extends Resource {
  /** Get the mode the robot is operating in. */
  getMode: (extra?: Struct) => Promise<Mode>;

  /**
   * Set the mode the robot is operating in.
   *
   * @param mode - The mode for the service to operate in.
   */
  setMode: (mode: Mode, extra?: Struct) => Promise<void>;

  /** Get the current location of the robot. */
  getLocation: (extra?: Struct) => Promise<NavigationPosition>;

  /** Get an array of waypoints currently in the service's data storage. */
  getWayPoints: (extra?: Struct) => Promise<Waypoint[]>;

  /**
   * Add a waypoint to the service's data storage.
   *
   * @param location - The current location of the robot n the navigation
   *   service with latitude and longitude values.
   */
  addWayPoint: (location: GeoPoint, extra?: Struct) => Promise<void>;

  /**
   * Remove a waypoint from the service's data storage.
   *
   * @param id - The MongoDB ObjectID of the waypoint to remove from the
   *   service's data storage.
   */
  removeWayPoint: (id: string, extra?: Struct) => Promise<void>;

  /** Get a list of obstacles. */
  getObstacles: (extra?: Struct) => Promise<GeoGeometry[]>;

  /** Gets the list of paths known to the navigation service. */
  getPaths: (extra?: Struct) => Promise<Path[]>;

  /** Gets information on the properties of the current navigation service. */
  getProperties: () => Promise<NavigationProperties>;
}
