import type { Struct } from '@bufbuild/protobuf';
import { MachineConnectionEvent } from '../events';
import type { PoseInFrame, Transform } from '../gen/common/v1/common_pb';
import type proto from '../gen/robot/v1/robot_pb';
import type { ResourceName } from '../types';
import type { ModuleModel } from '../gen/robot/v1/robot_pb';

export type CloudMetadata = proto.GetCloudMetadataResponse;

type Callback = (args: unknown) => void;

export interface Robot {
  /**
   * Get the list of sessions currently connected to the robot.
   *
   * @group Sessions
   * @alpha
   */
  getSessions(): Promise<proto.Session[]>;

  /**
   * Get the list of operations currently running on the robot.
   *
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
   * @param id - ID of operation to block on.
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
  stopAll(extra?: Map<string, Struct>): Promise<void>;

  /**
   * Get the configuration of the frame system of a given robot.
   *
   * @group Frame System
   * @alpha
   */
  frameSystemConfig(transform: Transform[]): Promise<proto.FrameSystemConfig[]>;

  /**
   * Transform a given source Pose from the reference frame to a new specified
   * destination which is a reference frame.
   *
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
   * Get the list of models provided by modules on the machine.
   *
   * @group Resources
   * @alpha
   */
  getModelsFromModules(): Promise<ModuleModel[]>;

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
   * Call a function when a connection event occurs.
   *
   * Note that direct gRPC connections that disconnect will not emit a
   * disconnect event. WebRTC connections that disconnect will emit a disconnect
   * event. All connections emit events during manual calls of `connect` and
   * `disconnect`.
   *
   * @param type - The event MachineConnectionEvent that was triggered, or all
   *   connection events with 'connectionstatechange'.
   * @param listener - The function to call
   * @alpha
   */
  on: (
    type: MachineConnectionEvent | 'connectionstatechange',
    listener: Callback
  ) => void;

  /**
   * Get app-related information about the robot.
   *
   * @group App/Cloud
   * @alpha
   */
  getCloudMetadata(): Promise<CloudMetadata>;

  /**
   * Get the current status of the robot.
   *
   * @alpha
   */
  getMachineStatus(): Promise<proto.GetMachineStatusResponse>;

  /**
   * Restarts a module running on the machine with the given id or name.
   *
   * @param moduleId - The id matching the module_id field of the registry
   *   module in your part configuration
   * @param moduleName - The name matching the name field of the local/registry
   *   module in your part configuration
   * @group Modules
   * @alpha
   */
  restartModule(moduleId?: string, moduleName?: string): Promise<void>;
}
