import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type {
  Costmap,
  Location,
  Plan,
  Position,
  Properties,
  Route,
  Status,
  Waypoint,
  Zone,
} from './types';

/**
 * A service that navigates a robot to user defined endpoints, locations, or routes using either a
 * local SLAM map or GPS.
 *
 * @example
 *
 * ```ts
 * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
 *
 * const status = await navigation.getNavigationStatus();
 * ```
 *
 * For more information, see [Navigation
 * API](https://docs.viam.com/dev/reference/apis/services/navigation/).
 */
export interface Navigation extends Resource {
  /**
   * Save a named position on the active map. If position is omitted, the robot's current position
   * from getPosition is saved.
   *
   * @param locationName - The name to save the location under.
   * @param position - The position to save. Defaults to the robot's current position.
   */
  addLocation: (locationName: string, position?: Position, extra?: Struct) => Promise<Location>;

  /**
   * Get a saved location by name. This does not return the robot's current position; use
   * getPosition for that.
   *
   * @param locationName - The name of the location to get.
   */
  getLocation: (locationName: string, extra?: Struct) => Promise<Location>;

  /** List all saved locations on the active map. */
  listLocations: (extra?: Struct) => Promise<Location[]>;

  /**
   * Change a saved location's position or name. Renaming a location updates every route waypoint
   * that references it.
   *
   * @param locationName - The name of the location to update.
   * @param position - The new position. Omit to leave the position unchanged.
   * @param newName - The new name. Omit to leave the name unchanged.
   */
  updateLocation: (
    locationName: string,
    position?: Position,
    newName?: string,
    extra?: Struct,
  ) => Promise<Location>;

  /**
   * Delete a saved location. The location is also removed from every route that references it.
   *
   * @param locationName - The name of the location to delete.
   */
  deleteLocation: (locationName: string, extra?: Struct) => Promise<void>;

  /**
   * Create a named route from an ordered list of waypoints. Every referenced location must already
   * exist.
   *
   * @param routeName - The name to save the route under.
   * @param waypoints - The ordered list of waypoints for the route.
   */
  addRoute: (routeName: string, waypoints: Waypoint[], extra?: Struct) => Promise<Route>;

  /**
   * Get a route by name.
   *
   * @param routeName - The name of the route to get.
   */
  getRoute: (routeName: string, extra?: Struct) => Promise<Route>;

  /** List all routes on the active map. */
  listRoutes: (extra?: Struct) => Promise<Route[]>;

  /**
   * Rename a route and/or replace its waypoints. An omitted waypoints list leaves the waypoints
   * unchanged; an empty list clears them.
   *
   * @param routeName - The name of the route to update.
   * @param newName - The new name. Omit to leave the name unchanged.
   * @param waypoints - The replacement waypoints. Omit to leave them unchanged.
   */
  updateRoute: (
    routeName: string,
    newName?: string,
    waypoints?: Waypoint[],
    extra?: Struct,
  ) => Promise<Route>;

  /**
   * Delete a route. The locations it references are not affected.
   *
   * @param routeName - The name of the route to delete.
   */
  deleteRoute: (routeName: string, extra?: Struct) => Promise<void>;

  /**
   * Create a keep-out or speed-limit zone on the active map. The planner avoids keep-out zones and
   * caps speed inside speed-limit zones.
   *
   * @param zoneName - The name to save the zone under.
   * @param type - Either "keepout" or "speed_limit".
   * @param geometry - The zone's geometry (circle, box, or polygon).
   * @param maxSpeed - The max speed in meters/sec. Required when type is "speed_limit".
   */
  addZone: (
    zoneName: string,
    type: string,
    geometry: Struct,
    maxSpeed?: number,
    extra?: Struct,
  ) => Promise<Zone>;

  /**
   * Get a zone by name.
   *
   * @param zoneName - The name of the zone to get.
   */
  getZone: (zoneName: string, extra?: Struct) => Promise<Zone>;

  /**
   * List zones on the active map, optionally filtered by type.
   *
   * @param type - Optional; "keepout" or "speed_limit".
   */
  listZones: (type?: string, extra?: Struct) => Promise<Zone[]>;

  /**
   * Change a zone's type, geometry, speed limit, or name.
   *
   * @param zoneName - The name of the zone to update.
   * @param type - Optional; "keepout" or "speed_limit".
   * @param geometry - Optional; the zone's new geometry.
   * @param maxSpeed - Optional; the new max speed in meters/sec.
   * @param newName - Optional; the new name for the zone.
   */
  updateZone: (
    zoneName: string,
    type?: string,
    geometry?: Struct,
    maxSpeed?: number,
    newName?: string,
    extra?: Struct,
  ) => Promise<Zone>;

  /**
   * Delete a zone.
   *
   * @param zoneName - The name of the zone to delete.
   */
  deleteZone: (zoneName: string, extra?: Struct) => Promise<void>;

  /**
   * Plan an obstacle-aware path to a saved location and start driving it. Returns once the goal is
   * accepted; track progress with getNavigationStatus.
   *
   * @param locationName - The name of the saved location to navigate to.
   */
  navigateToLocation: (locationName: string, extra?: Struct) => Promise<Status>;

  /**
   * Plan an obstacle-aware path to a Position and start driving it. Returns once the goal is
   * accepted; track progress with getNavigationStatus.
   *
   * @param destination - The destination to navigate to.
   */
  navigateToPoint: (destination: Position, extra?: Struct) => Promise<Status>;

  /**
   * Drive a route one waypoint at a time using the obstacle-aware planner. Provide either routeName
   * (a saved route) or waypoints (an inline list).
   *
   * @param routeName - Optional; the name of a saved route.
   * @param waypoints - Optional; an inline list of waypoints.
   * @param startIndex - Optional; the index to start from. Defaults to 0.
   * @param startNearest - Optional; start from the nearest waypoint instead, overriding startIndex.
   * @param loop - Optional; loop the route. Defaults to false.
   * @param wait - Optional; with loop, only return once stopped. Defaults to false.
   */
  navigateRoute: (
    routeName: string,
    waypoints: Waypoint[],
    startIndex?: number,
    startNearest?: boolean,
    loop?: boolean,
    wait?: boolean,
    extra?: Struct,
  ) => Promise<Status>;

  /**
   * Compute a path from the robot (or a given start) to a Position without moving. Pass a feasible
   * result to executePlan to drive it. Raises an error if no path exists.
   *
   * @param destination - The destination to plan to.
   * @param start - Optional; the starting position. Defaults to getPosition.
   */
  planToPoint: (destination: Position, start?: Position, extra?: Struct) => Promise<Plan>;

  /**
   * Compute a path to a saved location without moving. Accepts the same optional start as
   * planToPoint. Raises an error if no path exists.
   *
   * @param locationName - The name of the saved location to plan to.
   * @param start - Optional; the starting position. Defaults to getPosition.
   */
  planToLocation: (locationName: string, start?: Position, extra?: Struct) => Promise<Plan>;

  /**
   * Drive a Plan, typically from planToPoint or planToLocation. While navigating, the active path
   * is available on getNavigationStatus. Rejected if the path is empty.
   *
   * @param plan - The plan to execute.
   */
  executePlan: (plan: Plan, extra?: Struct) => Promise<Status>;

  /**
   * Drive directly to a saved location with a closed-loop controller, without full path planning.
   * Intended for short hops and docking.
   *
   * @param locationName - The name of the saved location to go to.
   * @param wait - Optional; default true. With false, returns immediately while navigating.
   * @param linearMPerSec - Optional; the linear speed to drive at.
   */
  goToLocation: (
    locationName: string,
    wait?: boolean,
    linearMPerSec?: number,
    extra?: Struct,
  ) => Promise<Status>;

  /**
   * Drive directly to a Position with a closed-loop controller, without full path planning.
   * Intended for short hops and docking.
   *
   * @param destination - The destination to go to.
   * @param wait - Optional; default true. With false, returns immediately while navigating.
   * @param linearMPerSec - Optional; the linear speed to drive at.
   */
  goToPoint: (
    destination: Position,
    wait?: boolean,
    linearMPerSec?: number,
    extra?: Struct,
  ) => Promise<Status>;

  /**
   * Stop motion but remember the current goal, including the current waypoint and loop setting for
   * routes. A suspended goal must be canceled before a new one starts.
   *
   * @param reason - Optional; reported on the suspended goal.
   */
  suspend: (reason?: string, extra?: Struct) => Promise<Status>;

  /**
   * Resume the suspended goal the same way it was started: planned navigation, simple go-to, or a
   * route from its current waypoint.
   */
  resume: (extra?: Struct) => Promise<Status>;

  /** Stop all motion and discard both the active goal and any suspended goal. */
  cancel: (extra?: Struct) => Promise<Status>;

  /**
   * Get the robot's current position on the active map. Use this for frequent position polling;
   * getNavigationStatus reports the same position alongside the rest of the navigation state.
   */
  getPosition: (extra?: Struct) => Promise<Position>;

  /** Get the full navigation state, including the robot's current position and the latest goal. */
  getNavigationStatus: (extra?: Struct) => Promise<Status>;

  /**
   * Get the map type the service operates on and robot properties. These values do not change while
   * the service is running.
   */
  getProperties: () => Promise<Properties>;

  /**
   * Get the local or global costmap as a downsampled grid, for display in UIs.
   *
   * @param layer - Optional; "auto", "local", or "global". Defaults to "auto".
   * @param stride - Optional; the downsample factor. Defaults to 2.
   */
  getCostmap: (layer?: string, stride?: number, extra?: Struct) => Promise<Costmap>;
}
