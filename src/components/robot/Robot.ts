import type {
  PoseInFrame,
  ResourceName,
  Transform,
} from '../../gen/common/v1/common_pb.esm';
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import type { Extra } from '../../types';
import type proto from '../../gen/robot/v1/robot_pb.esm';

export interface Robot {
  // OPERATIONS

  /**
   * Get the list of operations currently running on the robot.
   *
   * @privateRemarks
   *   TODO: this function should return a yet-to-be-defined Operation type
   *   instead of just returning the proto definition.
   * @alpha
   */
  getOperations(): Promise<proto.Operation[]>;

  /**
   * Cancels the specified operation on the robot.
   *
   * @param id - ID of operation to kill.
   * @alpha
   */
  cancelOperation(id: string): Promise<void>;

  /**
   * Blocks on the specified operation on the robot. This function will only
   * return when the specific operation has finished or has been cancelled.
   *
   * @param id (str) - ID of operation to block on.
   * @alpha
   */
  blockForOperation(id: string): Promise<void>;

  getSessions(): Promise<proto.GetSessionsResponse>;
  resourceNames(): Promise<proto.ResourceNamesResponse>;
  resourceRPCSubtypes(): Promise<proto.ResourceRPCSubtypesResponse>;
  discoverComponents(
    queries: proto.DiscoveryQuery[]
  ): Promise<proto.DiscoverComponentsResponse>;
  frameSystemConfig(
    transform: Transform[]
  ): Promise<proto.FrameSystemConfigResponse>;
  transformPose(
    source: PoseInFrame,
    destination: string,
    supplemental_transforms: Transform[]
  ): Promise<proto.TransformPoseResponse>;
  transformPCD(
    point_cloud_pcd: Uint8Array,
    source: string,
    destination: string
  ): Promise<proto.TransformPCDResponse>;
  getStatus(resource_names: ResourceName[]): Promise<proto.GetStatusResponse>;
  streamStatus(
    resource_names: ResourceName[],
    duration: Duration
  ): Promise<proto.StreamStatusResponse>;
  stopAll(extra?: Extra): Promise<proto.StopAllResponse>;
  startSession(resume: string): Promise<proto.StartSessionResponse>;
  sendSessionHeartbeat(id: string): Promise<proto.SendSessionHeartbeatResponse>;
}
