import type { GeoObstacle, GeoPoint, Resource, StructType } from '../../types';
import type { ModeMap, Waypoint, NavigationPosition } from './types';

/**
 * A service that uses GPS to automatically navigate a robot to user defined
 * endpoints.
 */
export interface Navigation extends Resource {
  /** Get the mode the robot is operating in. */
  getMode: (extra?: StructType) => Promise<ModeMap[keyof ModeMap]>;

  /**
   * Set the mode the robot is operating in.
   *
   * @param mode - The mode for the service to operate in.
   */
  setMode: (mode: ModeMap[keyof ModeMap], extra?: StructType) => Promise<void>;

  /** Get the current location of the robot. */
  getLocation: (extra?: StructType) => Promise<NavigationPosition>;

  /** Get an array of waypoints currently in the service's data storage. */
  getWayPoints: (extra?: StructType) => Promise<Waypoint[]>;

  /**
   * Add a waypoint to the service's data storage.
   *
   * @param location - The current location of the robot n the navigation
   *   service with latitude and longitude values.
   */
  addWayPoint: (location: GeoPoint, extra?: StructType) => Promise<void>;

  /**
   * Remove a waypoint from the service's data storage.
   *
   * @param id - The MongoDB ObjectID of the waypoint to remove from the
   *   service's data storage.
   */
  removeWayPoint: (id: string, extra?: StructType) => Promise<void>;

  /** Get a list of obstacles. */
  getObstacles: (extra?: StructType) => Promise<GeoObstacle[]>;
}
