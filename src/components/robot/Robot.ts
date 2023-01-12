import type { commonApi, robotApi } from '../../main'

import type { DiscoveryQuery } from '../../gen/robot/v1/robot_pb.esm'
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb'
import type { Extra } from '../../types'

export interface Robot {
    getOperations(): Promise<robotApi.GetOperationsResponse>;
    getSessions(): Promise<robotApi.GetSessionsResponse>;
    resourceNames(): Promise<robotApi.ResourceNamesResponse>;
    resourceRPCSubtypes(): Promise<robotApi.ResourceRPCSubtypesResponse>;
    cancelOperation(id: string): Promise<robotApi.CancelOperationResponse>;
    blockForOperation(id: string): Promise<robotApi.BlockForOperationResponse>;
    discoverComponents(queries: DiscoveryQuery[]): Promise<robotApi.DiscoverComponentsResponse>;
    frameSystemConfig(transform: commonApi.Transform[]): Promise<robotApi.FrameSystemConfigResponse>;
    transformPose(source: commonApi.PoseInFrame, destination: string,
        supplemental_transforms: commonApi.Transform[]): Promise<robotApi.TransformPoseResponse>;
    transformPCD(point_cloud_pcd: Uint8Array, source: string, destination: string): Promise<robotApi.TransformPCDResponse>;
    getStatus(resource_names: commonApi.ResourceName[]): Promise<robotApi.GetStatusResponse>;
    streamStatus(resource_names: commonApi.ResourceName[], duration: Duration): Promise<robotApi.StreamStatusResponse>;
    stopAll(extra?: Extra): Promise<robotApi.StopAllResponse>;
    startSession(resume: string): Promise<robotApi.StartSessionResponse>;
    sendSessionHeartbeat(id: string): Promise<robotApi.SendSessionHeartbeatResponse>;
}


