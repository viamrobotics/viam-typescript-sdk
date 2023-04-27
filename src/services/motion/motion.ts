import type {
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
   * @param destination - Specify a destination to, which can be any pose with
   *   respect to the SLAM map's origin.
   * @param componentName - Component on the robot to move to the specified
   *   destination.
   * @param slamServiceName - Name of the slam service from which the SLAM map
   *   is requested
   */
  moveOnMap: (
    destination: Pose,
    componentName: ResourceName,
    slamServiceName: ResourceName,
    extra?: StructType
  ) => Promise<boolean>;

  /**
   * @param destination - Destination to move to, which can a pose in the
   *   reference frame of any frame in the robot's frame system.
   * @param componentName - Component on the robot to move to the specified
   *   destination.
   * @param worldState - Avoid obstacles by specifying their geometries in the
   *   world state. Augment the frame system of the robot by specifying
   *   additional transforms to add to it for the duration of the Move.
   */
  moveSingleComponent: (
    destination: PoseInFrame,
    componentName: ResourceName,
    worldState?: WorldState,
    extra?: StructType
  ) => Promise<boolean>;

  /**
   * @param componentName - The component whose pose is being requested.
   * @param destinationFrame - The reference frame in which the component's pose
   *   should be provided, if unset this defaults to the "world" reference
   *   frame.
   * @param supplementalTransforms - Pose information on any additional
   *   reference frames that are needed to compute the component's pose.
   */
  getPose: (
    componentName: ResourceName,
    destinationFrame: string,
    supplementalTransforms: Transform[],
    extra?: StructType
  ) => Promise<PoseInFrame>;
}
