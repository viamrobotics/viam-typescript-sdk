import type {
  PoseInFrame,
  ResourceName,
  Transform,
} from '../../gen/common/v1/common_pb.esm';
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import type { Extra } from '../../types';
import type proto from '../../gen/robot/v1/robot_pb.esm';

export interface Robot {
  getOperations(): Promise<proto.GetOperationsResponse>;
  getSessions(): Promise<proto.GetSessionsResponse>;
  resourceNames(): Promise<proto.ResourceNamesResponse>;
  resourceRPCSubtypes(): Promise<proto.ResourceRPCSubtypesResponse>;
  cancelOperation(id: string): Promise<proto.CancelOperationResponse>;
  blockForOperation(id: string): Promise<proto.BlockForOperationResponse>;
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
