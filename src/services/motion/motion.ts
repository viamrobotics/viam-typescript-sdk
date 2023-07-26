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
import type { Constraints } from './types';

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
   * Move a component to a specific latitude and longitude, using a `Movement
   * Sensor` to determine the location.
   *
   * @param destination - Destination for the component to move to, represented
   *   as a `GeoPoint`.
   * @param componentName - The name of the component to move.
   * @param movementSensorName - The name of the `Movement Sensor` used to check
   *   the robot's location.
   * @param obstaclesList - Obstacles to consider when planning the motion of
   *   the component.
   * @param heading - Compass heading, in degrees, to achieve at destination
   * @param linearMetersPerSec - Linear velocity to target when moving.
   * @param angularDegPerSec - Angular velocity to target when moving.
   */
  moveOnGlobe: (
    destination: GeoPoint,
    componentName: ResourceName,
    movementSensorName: ResourceName,
    heading?: number,
    obstaclesList?: GeoObstacle[],
    linearMetersPerSec?: number,
    angularDegPerSec?: number,
    extra?: StructType
  ) => Promise<boolean>;

  /**
   * Move a single component.
   *
   * @param destination - Destination to move to, which can a pose in the
   *   reference frame of any frame in the robot's frame system.
   * @param componentName - Component on the robot to move to the specified
   *   destination.
   * @param worldState - Avoid obstacles by specifying their geometries in the
   *   `WorldState`. Augment the frame system of the robot by specifying
   *   additional transforms to add to it for the duration of the Move.
   */
  moveSingleComponent: (
    destination: PoseInFrame,
    componentName: ResourceName,
    worldState?: WorldState,
    extra?: StructType
  ) => Promise<boolean>;

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
