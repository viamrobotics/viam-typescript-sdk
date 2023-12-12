import type {
  GeoObstacle,
  GeoPoint,
  Pose,
  PoseInFrame,
  Resource,
  ResourceName,
  StructType,
  Transform,
  WorldState,
} from '../../types';
import type {
  Constraints,
  MotionConfiguration,
  GetPlanResponse,
  ListPlanStatusesResponse,
} from './types';

/**
 * A service that coordinates motion planning across all of the components in a
 * given robot.
 */
export interface Motion extends Resource {
  /**
   * Move any component on the robot to a specified destination which can be
   * from the reference frame of any other component on the robot.
   *
   * @param destination - Destination to move to, which can a pose in the
   *   reference frame of any frame in the robot's frame system.
   * @param componentName - Component on the robot to move to the specified
   *   destination.
   * @param worldState - Avoid obstacles by specifying their geometries in the
   *   world state. Augment the frame system of the robot by specifying
   *   additional transforms to add to it for the duration of the Move.
   * @param constraints - Constrain the way the robot will move.
   */
  move: (
    destination: PoseInFrame,
    componentName: ResourceName,
    worldState?: WorldState,
    constraints?: Constraints,
    extra?: StructType
  ) => Promise<boolean>;

  /**
   * Move a component to a `Pose` in respect to the origin of the SLAM map.
   *
   * @param destination - Specify a destination to, which can be any `Pose` with
   *   respect to the SLAM map's origin.
   * @param componentName - Component on the robot to move to the specified
   *   destination.
   * @param slamServiceName - Name of the `SLAM` service from which the SLAM map
   *   is requested
   */
  moveOnMap: (
    destination: Pose,
    componentName: ResourceName,
    slamServiceName: ResourceName,
    extra?: StructType
  ) => Promise<boolean>;

  /**
   * Move a component to a specific latitude and longitude, using a
   * `MovementSensor` to check the location. `moveOnGlobe()` is non blocking,
   * meaning the motion service will move the component to the destination GPS
   * point after `moveOnGlobe()` returns. Each successful `moveOnGlobe()`
   * call retuns a unique ExectionID which you can use to identify all plans
   * generated durring the `moveOnGlobe()` call. You can monitor the progress
   * of the `moveOnGlobe()` call by querying `getPlan()` and
   * `listPlanStatuses()`.
   *
   * @param destination - Destination for the component to move to, represented
   *   as a `GeoPoint`.
   * @param componentName - The name of the component to move.
   * @param movementSensorName - The name of the `Movement Sensor` used to check
   *   the robot's location.
   * @param obstaclesList - Obstacles to consider when planning the motion of
   *   the component.
   * @param heading - Compass heading, in degrees, to achieve at destination.
   * @param motionConfiguration - Optional motion configuration options.
   */
  moveOnGlobe: (
    destination: GeoPoint,
    componentName: ResourceName,
    movementSensorName: ResourceName,
    heading?: number,
    obstaclesList?: GeoObstacle[],
    motionConfiguration?: MotionConfiguration,
    extra?: StructType
  ) => Promise<string>;

  /**
   * Stop a component being moved by an in progress `moveOnGlobe()` call.
   *
   * @param componentName - The component to stop
   */
  stopPlan: (componentName: ResourceName, extra?: StructType) => Promise<null>;

  /**
   * By default: returns the plan history of the most recent
   * `move_on_globe_new()` call to move a component. The plan history for
   * executions before the most recent can be requested by providing an
   * ExecutionID in the request. Returns a result if both of the following
   * conditions are met:
   *
   * - The execution (call to `move_on_globe_new()`) is still executing **or**
   *   changed state within the last 24 hours
   * - The robot has not reinitialized Plans never change. Replans always create
   *   new plans. Replans share the ExecutionID of the previously executing
   *   plan. All repeated fields are in time ascending order.
   *
   * @param componentName - The component to query
   * @param destinationFrame - The reference frame in which the component's
   *   `Pose` should be provided, if unset this defaults to the "world"
   *   reference frame.
   * @param supplementalTransforms - `Pose` information on any additional
   *   reference frames that are needed to compute the component's `Pose`.
   */
  getPlan: (
    componentName: ResourceName,
    lastPlanOnly?: boolean,
    executionId?: string,
    extra?: StructType
  ) => Promise<GetPlanResponse>;

  /**
   * Get the current location and orientation of a component.
   *
   * @param componentName - The component whose `Pose` is being requested.
   * @param destinationFrame - The reference frame in which the component's
   *   `Pose` should be provided, if unset this defaults to the "world"
   *   reference frame.
   * @param supplementalTransforms - `Pose` information on any additional
   *   reference frames that are needed to compute the component's `Pose`.
   */
  listPlanStatuses: (
    onlyActivePlans?: boolean,
    extra?: StructType
  ) => Promise<ListPlanStatusesResponse>;

  /**
   * Get the current location and orientation of a component.
   *
   * @param componentName - The component whose `Pose` is being requested.
   * @param destinationFrame - The reference frame in which the component's
   *   `Pose` should be provided, if unset this defaults to the "world"
   *   reference frame.
   * @param supplementalTransforms - `Pose` information on any additional
   *   reference frames that are needed to compute the component's `Pose`.
   */
  getPose: (
    componentName: ResourceName,
    destinationFrame: string,
    supplementalTransforms: Transform[],
    extra?: StructType
  ) => Promise<PoseInFrame>;
}
