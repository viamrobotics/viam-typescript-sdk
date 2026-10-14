import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type {
  CostmapOptions,
  GoToOptions,
  NavigateRouteOptions,
  NavigationCostmap,
  NavigationLocation,
  NavigationPlan,
  NavigationPosition,
  NavigationProperties,
  NavigationStatus,
  Route,
  UpdateLocationOptions,
  UpdateRouteOptions,
  UpdateZoneOptions,
  Waypoint,
  Zone,
  ZoneType,
} from './types';

/**
 * A service that navigates a robot to saved locations, along routes, or to arbitrary points on its
 * map.
 *
 * Positions are map-typed: on a local (SLAM) map a position is a `pose`, and on a GPS map it is a
 * `geoPose`. Use {@link Navigation.getProperties} to find out which one the service uses.
 *
 * Methods that start, suspend, resume, or cancel motion return the robot's {@link NavigationStatus},
 * including the state of the latest goal.
 *
 * @example
 *
 * ```ts
 * const navigation = new VIAM.NavigationClient(machine, 'my_navigation');
 *
 * const status = await navigation.navigateToLocation('dock');
 * ```
 *
 * For more information, see [Navigation
 * API](https://docs.viam.com/dev/reference/apis/services/navigation/).
 */
export interface Navigation extends Resource {
  /**
   * Save a named location.
   *
   * @example
   *
   * ```ts
   * // Save the robot's current position
   * await navigation.addLocation('dock');
   *
   * // Save a GPS position
   * await navigation.addLocation('gate', {
   *   value: {
   *     case: 'geoPose',
   *     value: { location: { latitude: 40.7128, longitude: -74.006 } },
   *   },
   * });
   * ```
   *
   * @param locationName - The name to save the location under.
   * @param position - The position to save. Omit to use the robot's current position.
   * @returns The saved location.
   */
  addLocation: (
    locationName: string,
    position?: NavigationPosition,
    extra?: Struct,
  ) => Promise<NavigationLocation>;

  /**
   * Get a saved location by name.
   *
   * @example
   *
   * ```ts
   * const dock = await navigation.getLocation('dock');
   * ```
   *
   * @param locationName - The name of the saved location.
   */
  getLocation: (locationName: string, extra?: Struct) => Promise<NavigationLocation>;

  /**
   * List all saved locations.
   *
   * @example
   *
   * ```ts
   * const locations = await navigation.listLocations();
   * ```
   */
  listLocations: (extra?: Struct) => Promise<NavigationLocation[]>;

  /**
   * Move or rename a saved location.
   *
   * @example
   *
   * ```ts
   * await navigation.updateLocation('dock', { newName: 'charger' });
   * ```
   *
   * @param locationName - The name of the saved location.
   * @param update - The fields to change. Omitted fields are left unchanged.
   * @returns The updated location.
   */
  updateLocation: (
    locationName: string,
    update: UpdateLocationOptions,
    extra?: Struct,
  ) => Promise<NavigationLocation>;

  /**
   * Delete a saved location.
   *
   * @example
   *
   * ```ts
   * await navigation.deleteLocation('dock');
   * ```
   *
   * @param locationName - The name of the saved location.
   */
  deleteLocation: (locationName: string, extra?: Struct) => Promise<void>;

  /**
   * Save a named route. Requires `routesSupported` in {@link Navigation.getProperties}.
   *
   * @example
   *
   * ```ts
   * await navigation.addRoute('patrol', [
   *   { value: { case: 'location', value: 'dock' } },
   *   { value: { case: 'location', value: 'gate' } },
   * ]);
   * ```
   *
   * @param routeName - The name to save the route under.
   * @param waypoints - The ordered stops, each a saved location name or an inline position.
   * @returns The saved route.
   */
  addRoute: (routeName: string, waypoints: Waypoint[], extra?: Struct) => Promise<Route>;

  /**
   * Get a saved route by name.
   *
   * @example
   *
   * ```ts
   * const route = await navigation.getRoute('patrol');
   * ```
   *
   * @param routeName - The name of the saved route.
   */
  getRoute: (routeName: string, extra?: Struct) => Promise<Route>;

  /**
   * List all saved routes.
   *
   * @example
   *
   * ```ts
   * const routes = await navigation.listRoutes();
   * ```
   */
  listRoutes: (extra?: Struct) => Promise<Route[]>;

  /**
   * Rename a saved route or replace its waypoints.
   *
   * @example
   *
   * ```ts
   * await navigation.updateRoute('patrol', { newName: 'night-patrol' });
   * ```
   *
   * @param routeName - The name of the saved route.
   * @param update - The fields to change. Omitted fields are left unchanged; an empty `waypoints`
   *   array clears the route.
   * @returns The updated route.
   */
  updateRoute: (routeName: string, update: UpdateRouteOptions, extra?: Struct) => Promise<Route>;

  /**
   * Delete a saved route.
   *
   * @example
   *
   * ```ts
   * await navigation.deleteRoute('patrol');
   * ```
   *
   * @param routeName - The name of the saved route.
   */
  deleteRoute: (routeName: string, extra?: Struct) => Promise<void>;

  /**
   * Add a keep-out or speed-limit zone. Requires `zonesSupported` in
   * {@link Navigation.getProperties}.
   *
   * @example
   *
   * ```ts
   * await navigation.addZone('loading-bay', 'speed_limit', geometry, 0.5);
   * ```
   *
   * @param zoneName - The name of the zone.
   * @param type - `keepout` or `speed_limit`.
   * @param geometry - A circle, box, or polygon, as described in the Navigation API. Units are
   *   millimeters on local maps and meters on GPS maps.
   * @param maxSpeed - Max speed in meters/sec. Required for `speed_limit` zones.
   * @returns The new zone.
   */
  addZone: (
    zoneName: string,
    type: ZoneType,
    geometry: Record<string, JsonValue>,
    maxSpeed?: number,
    extra?: Struct,
  ) => Promise<Zone>;

  /**
   * Get a zone by name.
   *
   * @example
   *
   * ```ts
   * const zone = await navigation.getZone('loading-bay');
   * ```
   *
   * @param zoneName - The name of the zone.
   */
  getZone: (zoneName: string, extra?: Struct) => Promise<Zone>;

  /**
   * List zones, optionally filtered by type.
   *
   * @example
   *
   * ```ts
   * const keepouts = await navigation.listZones('keepout');
   * ```
   *
   * @param type - Only return zones of this type. Omit to return all zones.
   */
  listZones: (type?: ZoneType, extra?: Struct) => Promise<Zone[]>;

  /**
   * Change a zone.
   *
   * @example
   *
   * ```ts
   * await navigation.updateZone('loading-bay', { maxSpeed: 0.3 });
   * ```
   *
   * @param zoneName - The name of the zone.
   * @param update - The fields to change. Omitted fields are left unchanged.
   * @returns The updated zone.
   */
  updateZone: (zoneName: string, update: UpdateZoneOptions, extra?: Struct) => Promise<Zone>;

  /**
   * Delete a zone.
   *
   * @example
   *
   * ```ts
   * await navigation.deleteZone('loading-bay');
   * ```
   *
   * @param zoneName - The name of the zone.
   */
  deleteZone: (zoneName: string, extra?: Struct) => Promise<void>;

  /**
   * Plan a path to a saved location and start following it. Requires `planningSupported` in
   * {@link Navigation.getProperties}.
   *
   * @example
   *
   * ```ts
   * const status = await navigation.navigateToLocation('dock');
   * ```
   *
   * @param locationName - The name of the saved location.
   */
  navigateToLocation: (locationName: string, extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Plan a path to a position and start following it. Requires `planningSupported` in
   * {@link Navigation.getProperties}.
   *
   * @example
   *
   * ```ts
   * const status = await navigation.navigateToPoint({
   *   value: {
   *     case: 'geoPose',
   *     value: { location: { latitude: 40.7128, longitude: -74.006 } },
   *   },
   * });
   * ```
   *
   * @param destination - The position to navigate to.
   */
  navigateToPoint: (destination: NavigationPosition, extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Drive a saved or inline route. Requires `routesSupported` in {@link Navigation.getProperties}.
   *
   * @example
   *
   * ```ts
   * const status = await navigation.navigateRoute({ routeName: 'patrol', loop: true });
   * ```
   *
   * @param route - The route to drive and how to drive it.
   */
  navigateRoute: (route: NavigateRouteOptions, extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Plan a path to a position without moving. Pass the result to {@link Navigation.executePlan} to
   * follow it.
   *
   * @example
   *
   * ```ts
   * const plan = await navigation.planToPoint(destination);
   * console.log(`path is ${plan.lengthM} m`);
   * ```
   *
   * @param destination - The position to plan to.
   * @param start - The position to plan from. Defaults to the robot's current position.
   */
  planToPoint: (
    destination: NavigationPosition,
    start?: NavigationPosition,
    extra?: Struct,
  ) => Promise<NavigationPlan>;

  /**
   * Plan a path to a saved location without moving. Pass the result to
   * {@link Navigation.executePlan} to follow it.
   *
   * @example
   *
   * ```ts
   * const plan = await navigation.planToLocation('dock');
   * ```
   *
   * @param locationName - The name of the saved location.
   * @param start - The position to plan from. Defaults to the robot's current position.
   */
  planToLocation: (
    locationName: string,
    start?: NavigationPosition,
    extra?: Struct,
  ) => Promise<NavigationPlan>;

  /**
   * Follow a plan returned by {@link Navigation.planToPoint} or {@link Navigation.planToLocation}.
   *
   * @example
   *
   * ```ts
   * const plan = await navigation.planToLocation('dock');
   * const status = await navigation.executePlan(plan);
   * ```
   *
   * @param plan - The plan to follow.
   */
  executePlan: (plan: NavigationPlan, extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Drive straight to a saved location without path planning.
   *
   * @example
   *
   * ```ts
   * const status = await navigation.goToLocation('dock', { wait: false });
   * ```
   *
   * @param locationName - The name of the saved location.
   * @param options - Whether to wait for arrival (default true) and the linear speed.
   */
  goToLocation: (
    locationName: string,
    options?: GoToOptions,
    extra?: Struct,
  ) => Promise<NavigationStatus>;

  /**
   * Drive straight to a position without path planning.
   *
   * @example
   *
   * ```ts
   * const status = await navigation.goToPoint(destination, { linearMPerSec: 0.5 });
   * ```
   *
   * @param destination - The position to drive to.
   * @param options - Whether to wait for arrival (default true) and the linear speed.
   */
  goToPoint: (
    destination: NavigationPosition,
    options?: GoToOptions,
    extra?: Struct,
  ) => Promise<NavigationStatus>;

  /**
   * Pause the current goal. Resume it with {@link Navigation.resume}.
   *
   * @example
   *
   * ```ts
   * await navigation.suspend('door closed');
   * ```
   *
   * @param reason - Reported on the suspended goal.
   */
  suspend: (reason?: string, extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Resume a suspended goal.
   *
   * @example
   *
   * ```ts
   * await navigation.resume();
   * ```
   */
  resume: (extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Cancel the current goal and stop the robot.
   *
   * @example
   *
   * ```ts
   * await navigation.cancel();
   * ```
   */
  cancel: (extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Get the robot's current position on the map.
   *
   * @example
   *
   * ```ts
   * const position = await navigation.getPosition();
   * ```
   */
  getPosition: (extra?: Struct) => Promise<NavigationPosition>;

  /**
   * Get the robot's navigation state: position, localization, velocity, and the latest goal.
   *
   * @example
   *
   * ```ts
   * const { goal } = await navigation.getNavigationStatus();
   * ```
   */
  getNavigationStatus: (extra?: Struct) => Promise<NavigationStatus>;

  /**
   * Get the service's map type, robot footprint, and supported features. These do not change while
   * the service is running.
   *
   * @example
   *
   * ```ts
   * const properties = await navigation.getProperties();
   * ```
   */
  getProperties: () => Promise<NavigationProperties>;

  /**
   * Get the costmap the planner is using. Requires `costmapSupported` in
   * {@link Navigation.getProperties}.
   *
   * @example
   *
   * ```ts
   * const costmap = await navigation.getCostmap({ layer: 'global' });
   * ```
   *
   * @param options - Which layer to return and how much to downsample it.
   */
  getCostmap: (options?: CostmapOptions, extra?: Struct) => Promise<NavigationCostmap>;
}
