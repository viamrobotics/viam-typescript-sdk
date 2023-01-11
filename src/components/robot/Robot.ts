import type { commonApi, robotApi } from '../../main'

import type { DiscoveryQuery } from '../../gen/robot/v1/robot_pb.esm'
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb'
import type { Extra } from '../../types'

export interface Robot {
    GetOperations(): Promise<robotApi.GetOperationsResponse>;
    GetSessions(): Promise<robotApi.GetSessionsResponse>;
    ResourceNames(): Promise<robotApi.ResourceNamesResponse>;
    ResourceRPCSubtypes(): Promise<robotApi.ResourceRPCSubtypesResponse>;
    CancelOperation(id: string): Promise<robotApi.CancelOperationResponse>;
    BlockForOperation(id: string): Promise<robotApi.BlockForOperationResponse>;
    DiscoverComponents(queries: DiscoveryQuery[]): Promise<robotApi.DiscoverComponentsResponse>;
    FrameSystemConfig(transform: commonApi.Transform[]): Promise<robotApi.FrameSystemConfigResponse>;
    TransformPose(source: commonApi.PoseInFrame, destination: string,
        supplemental_transforms: commonApi.Transform[]): Promise<robotApi.TransformPoseResponse>;
    TransformPCD(point_cloud_pcd: Uint8Array, source: string, destination: string): Promise<robotApi.TransformPCDResponse>;
    GetStatus(resource_names: commonApi.ResourceName[]): Promise<robotApi.GetStatusResponse>;
    StreamStatus(resource_names: commonApi.ResourceName[], duration: Duration): Promise<robotApi.StreamStatusResponse>;
    StopAll(extra?: Extra): Promise<robotApi.StopAllResponse>;
    StartSession(resume: string): Promise<robotApi.StartSessionResponse>;
    SendSessionHeartbeat(id: string): Promise<robotApi.SendSessionHeartbeatResponse>;
}


