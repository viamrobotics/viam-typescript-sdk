import { GeoObstacle } from '../../gen/common/v1/common_pb';
import type { ModeMap } from '../../gen/service/navigation/v1/navigation_pb';
import { Waypoint } from '../../gen/service/navigation/v1/navigation_pb';
import type { GeoPoint, Resource, StructType } from '../../types';

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
   * @param mode -
   */
  setMode: (mode: ModeMap[keyof ModeMap], extra?: StructType) => Promise<void>;
  /** Get the current location of the robot. */
  getLocation: (extra?: StructType) => Promise<GeoPoint.AsObject>;
  /** Get an array of waypoints currently in the service's data storage. */
  getWayPoints: (extra?: StructType) => Promise<Array<Waypoint>>;
  /**
   * Add a waypoint to the service's data storage.
   *
   * @param location - The current location of the robot n the navigation service with latitude and longitude values.
   */
  addWayPoint: (location: GeoPoint, extra?: StructType) => Promise<void>;
  /**
   * Remove a waypoint from the service's data storage.
   * 
   * @param id - The MongoDB ObjectID of the waypoint to remove from the service's data storage.
   */
  removeWayPoint: (id: string, extra?: StructType) => Promise<void>;
  /**
   * Get a list of obstacles.
   */
  getObstacles: (extra?: StructType) => Promise<Array<GeoObstacle>>;
}
