import type { Struct } from '@bufbuild/protobuf';
import type {
  GeoGeometry,
  GeoPoint,
  Geometry,
  Pose,
  PoseInFrame,
  Resource,
  ResourceName,
  Transform,
  WorldState,
} from '../../types';
import type {
  Constraints,
  GetPlanResponse,
  ListPlanStatusesResponse,
  MotionConfiguration,
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
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   *
   * // Assumes a gripper configured with name "my_gripper"
   * const gripperName = new VIAM.ResourceName({ name: 'my_gripper', namespace: 'rdk', type: 'component', subtype: 'gripper' });
   *
   * const goalPose: VIAM.Pose = {
   *   x: -817, y: -230, z: 62,
   *   oX: -1, oY: 0, oZ: 0,
   *   theta: 90
   * };
   * const goalPoseInFrame = new VIAM.PoseInFrame({ referenceFrame: 'world', pose: goalPose });
   *
   * // Move the gripper
   * const moved = await motion.move(
   *   goalPoseInFrame,
   *   gripperName
   * );
   * ```
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
    extra?: Struct
  ) => Promise<boolean>;

  /**
   * Move a component to a `Pose` in respect to the origin of the SLAM map,
   * using a `SLAM` service to check the location. moveOnMap()`is non blocking,
   * meaning the motion service will move the component to the destination Pose
   * after`moveOnMap()`returns. Each successful`moveOnMap()`call retuns a unique
   * ExectionID which you can use to identify all plans generated durring
   * the`moveOnMap()`call. You can monitor the progress of the`moveOnMap()`call
   * by querying`getPlan()`and`listPlanStatuses()`.
   *
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   *
   * // Define destination pose with respect to map origin
   * const myPose: VIAM.Pose = {
   *   x: 0, y: 10, z: 0,
   *   oX: 0, oY: 0, oZ: 0,
   *   theta: 0
   * };
   *
   * const baseName = new VIAM.ResourceName({ name: 'my_base', namespace: 'rdk', type: 'component', subtype: 'base' });
   * const slamServiceName = new VIAM.ResourceName({ name: 'my_slam_service', namespace: 'rdk', type: 'service', subtype: 'slam' });
   *
   * // Move the base to Y=10 (location of 0,10,0) relative to map origin
   * const executionId = await motion.moveOnMap(
   *   myPose,
   *   baseName,
   *   slamServiceName
   * );
   * ```
   *
   * @param destination - Specify a destination to, which can be any `Pose` with
   *   respect to the SLAM map's origin.
   * @param componentName - Component on the robot to move to the specified
   *   destination.
   * @param slamServiceName - Name of the `SLAM` service from which the SLAM map
   *   is requested
   * @param motionConfiguration - Optional motion configuration options.
   * @param obstacles - Optional obstacles to be considered for motion planning.
   */
  moveOnMap: (
    destination: Pose,
    componentName: ResourceName,
    slamServiceName: ResourceName,
    motionConfiguration?: MotionConfiguration,
    obstacles?: Geometry[],
    extra?: Struct
  ) => Promise<string>;

  /**
   * Move a component to a specific latitude and longitude, using a
   * `MovementSensor` to check the location. `moveOnGlobe()` is non blocking,
   * meaning the motion service will move the component to the destination GPS
   * point after `moveOnGlobe()` returns. Each successful `moveOnGlobe()` call
   * retuns a unique ExectionID which you can use to identify all plans
   * generated durring the `moveOnGlobe()` call. You can monitor the progress of
   * the `moveOnGlobe()` call by querying `getPlan()` and `listPlanStatuses()`.
   *
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   *
   * // Define destination at GPS coordinates [0,0]
   * const destination: VIAM.GeoPoint = { latitude: 40.7, longitude: -73.98 };
   *
   * const baseName = new VIAM.ResourceName({ name: 'my_base', namespace: 'rdk', type: 'component', subtype: 'base' });
   * const movementSensorName = new VIAM.ResourceName({ name: 'my_movement_sensor', namespace: 'rdk', type: 'component', subtype: 'movement_sensor' });
   *
   * // Move the base to the geographic location
   * const globeExecutionId = await motion.moveOnGlobe(
   *   destination,
   *   baseName,
   *   movementSensorName
   * );
   * ```
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
   * @param boundingRegion - Set of obstacles which the robot must remain within
   *   while navigating
   */
  moveOnGlobe: (
    destination: GeoPoint,
    componentName: ResourceName,
    movementSensorName: ResourceName,
    heading?: number,
    obstaclesList?: GeoGeometry[],
    motionConfiguration?: MotionConfiguration,
    boundingRegion?: GeoGeometry[],
    extra?: Struct
  ) => Promise<string>;

  /**
   * Stop a component being moved by an in progress `moveOnGlobe()` or
   * `moveOnMap()` call.
   *
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   * const baseName = new VIAM.ResourceName({ name: 'my_base', namespace: 'rdk', type: 'component', subtype: 'base' });
   *
   * // Stop the base component which was instructed to move
   * await motion.stopPlan(baseName);
   * ```
   *
   * @param componentName - The component to stop
   */
  stopPlan: (componentName: ResourceName, extra?: Struct) => Promise<null>;

  /**
   * By default: returns the plan history of the most recent `moveOnGlobe()` or
   * `moveOnMap()` call to move a component. The plan history for executions
   * before the most recent can be requested by providing an ExecutionID in the
   * request. Returns a result if both of the following conditions are met:
   *
   * - The execution (call to `moveOnGlobe()` or `moveOnMap()`) is still executing
   *   **or** changed state within the last 24 hours
   * - The robot has not reinitialized
   *
   * Plans never change. Replans always create new plans. Replans share the
   * ExecutionID of the previously executing plan. All repeated fields are in
   * chronological order.
   *
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   * const baseName = new VIAM.ResourceName({ name: 'my_base', namespace: 'rdk', type: 'component', subtype: 'base' });
   *
   * // Get the plan(s) of the base component
   * const response = await motion.getPlan(baseName);
   * ```
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
    extra?: Struct
  ) => Promise<GetPlanResponse>;

  /**
   * Returns the statuses of plans created by MoveOnGlobe calls that meet at
   * least one of the following conditions since the motion service
   * initialized:
   *
   * - The plan's status is in progress
   * - The plan's status changed state within the last 24 hours
   *
   * All repeated fields are in chronological order.
   *
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   *
   * // List plan statuses within the TTL
   * const response = await motion.listPlanStatuses();
   * ```
   *
   * @param onlyActivePlans - If true, the response will only return plans which
   *   are executing.
   */
  listPlanStatuses: (
    onlyActivePlans?: boolean,
    extra?: Struct
  ) => Promise<ListPlanStatusesResponse>;

  /**
   * Get the current location and orientation of a component.
   *
   * @example
   *
   * ```ts
   * const motion = new VIAM.MotionClient(machine, 'builtin');
   *
   * const gripperName = new VIAM.ResourceName({ name: 'my_gripper', namespace: 'rdk', type: 'component', subtype: 'gripper' });
   *
   * // Get the gripper's pose in world coordinates
   * const gripperPoseInWorld = await motion.getPose(
   *   gripperName,
   *   'world',
   *   []
   * );
   * ```
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
    extra?: Struct
  ) => Promise<PoseInFrame>;
}
