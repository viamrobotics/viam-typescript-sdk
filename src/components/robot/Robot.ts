import type {
  PoseInFrame,
  ResourceName,
  Transform,
} from '../../gen/common/v1/common_pb.esm';
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import type { Extra } from '../../types';
import type proto from '../../gen/robot/v1/robot_pb.esm';

export interface Robot {
  /**
   * Get the list of operations currently running on the robot.
   *
   * @privateRemarks
   *   TODO: this function should return an more idiomatic type instead of just
   *   passing along a proto type.
   * @group Operations
   * @alpha
   */
  getOperations(): Promise<proto.Operation[]>;

  /**
   * Cancels the specified operation on the robot.
   *
   * @param id - ID of operation to kill.
   * @group Operations
   * @alpha
   */
  cancelOperation(id: string): Promise<void>;

  /**
   * Blocks on the specified operation on the robot. This function will only
   * return when the specific operation has finished or has been cancelled.
   *
   * @param id (str) - ID of operation to block on.
   * @group Operations
   * @alpha
   */
  blockForOperation(id: string): Promise<void>;

  /**
   * Cancel all current and outstanding operations for the robot and stop all
   * actuators and movement.
   *
   * @param extra - Any extra parameters to pass to the components' `stop`
   *   methods, keyed on the component's resource name.
   * @group Operations
   * @alpha
   */
  stopAll(extra?: Map<string, Extra>): Promise<void>;

  /**
   * Get the configuration of the frame system of a given robot.
   *
   * @privateRemarks
   *   TODO: this function should return an more idiomatic type instead of just
   *   passing along a proto type.
   * @group Frame System
   * @alpha
   */
  frameSystemConfig(transform: Transform[]): Promise<proto.FrameSystemConfig[]>;

  /**
   * Transform a given source Pose from the reference frame to a new specified
   * destination which is a reference frame.
   *
   * @privateRemarks
   *   TODO: this function should return an more idiomatic type instead of just
   *   passing along a proto type.
   * @param query - The pose that should be transformed
   * @param destination - The name of the reference frame to transform the given
   * @param supplementalTransforms - Pose information on any additional
   *   reference frames that are needed to perform the transform
   * @group Frame System
   * @alpha
   */
  transformPose(
    source: PoseInFrame,
    destination: string,
    supplementalTransforms: Transform[]
  ): Promise<PoseInFrame>;

  /**
   * Transform a given source point cloud from the reference frame to a new
   * specified destination which is a reference frame.
   *
   * @param pointCloudPCD - The point clouds to transform. This should be in the
   *   PCD format encoded into bytes:
   *   https://pointclouds.org/documentation/tutorials/pcd_file_format.html
   * @param source - The reference frame of the point cloud.
   * @param destination - The reference frame into which the source data should
   *   be transformed, if unset this defaults to the "world" reference frame. Do
   *   not move the robot between the generation of the initial pointcloud and
   *   the receipt of the transformed pointcloud because that will make the
   *   transformations inaccurate.
   * @group Frame System
   * @alpha
   */
  transformPCD(
    pointCloudPCD: Uint8Array,
    source: string,
    destination: string
  ): Promise<Uint8Array>;

  /**
   * Get the list of discovered component configurations.
   *
   * @privateRemarks
   *   TODO: this function should return an more idiomatic type instead of just
   *   passing along a proto type.
   * @param queries - The list of component models to discovery.
   * @group Discovery
   * @alpha
   */
  discoverComponents(
    queries: proto.DiscoveryQuery[]
  ): Promise<proto.Discovery[]>;

  /**
   * Get a list of all resources on the robot.
   *
   * @group Resources
   * @alpha
   */
  resourceNames(): Promise<ResourceName[]>;

  /**
   * Get a list of all resource types.
   *
   * @group Resources
   * @alpha
   */
  resourceRPCSubtypes(): Promise<proto.ResourceRPCSubtype[]>;

  /**
   * Get a list of all statuses requested. An empty request signifies all
   * resources.
   *
   * @param resourceNames - The list of resources for which to receive statuses.
   * @group Status
   * @alpha
   */
  getStatus(resourceNames: ResourceName[]): Promise<proto.Status[]>;

  /**
   * Periodically receive the status of all statuses requested. An empty request
   * signifies all resources.
   *
   * @param resourceNames - The list of resources for which to receive statuses.
   * @param duration - How often to send a new status.
   * @group Status
   * @alpha
   */
  streamStatus(
    resourceNames: ResourceName[],
    duration: Duration
  ): Promise<proto.Status[]>;
}
