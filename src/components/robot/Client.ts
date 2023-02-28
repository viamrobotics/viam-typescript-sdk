import type {
  PoseInFrame,
  ResourceName,
  Transform,
} from '../../gen/common/v1/common_pb.esm';
import type Client from '../../Client';
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import type { Robot } from './Robot';

import { RobotServiceClient } from '../../gen/robot/v1/robot_pb_service.esm';
import { promisify } from '../../utils';
import proto from '../../gen/robot/v1/robot_pb.esm';

/** A gRPC-web client for the Robot component. */
export class RobotClient implements Robot {
  private client: RobotServiceClient;

  constructor(client: Client) {
    this.client = client.createServiceClient(RobotServiceClient);
  }

  private get robotService() {
    return this.client;
  }

  // OPERATIONS

  async getOperations() {
    const robotService = this.robotService;
    const request = new proto.GetOperationsRequest();
    const response = await promisify<
      proto.GetOperationsRequest,
      proto.GetOperationsResponse
    >(robotService.getOperations.bind(robotService), request);
    return response.getOperationsList();
  }

  async cancelOperation(id: string) {
    const robotService = this.robotService;
    const request = new proto.CancelOperationRequest();
    request.setId(id);
    await promisify<
      proto.CancelOperationRequest,
      proto.CancelOperationResponse
    >(robotService.cancelOperation.bind(robotService), request);
  }

  async blockForOperation(id: string) {
    const robotService = this.robotService;
    const request = new proto.BlockForOperationRequest();
    request.setId(id);
    await promisify<
      proto.BlockForOperationRequest,
      proto.BlockForOperationResponse
    >(robotService.blockForOperation.bind(robotService), request);
  }

  async stopAll() {
    const robotService = this.robotService;
    const request = new proto.StopAllRequest();
    await promisify<proto.StopAllRequest, proto.StopAllResponse>(
      robotService.stopAll.bind(robotService),
      request
    );
  }

  // FRAME SYSTEM

  async frameSystemConfig(transforms: Transform[]) {
    const robotService = this.robotService;
    const request = new proto.FrameSystemConfigRequest();
    request.setSupplementalTransformsList(transforms);
    const response = await promisify<
      proto.FrameSystemConfigRequest,
      proto.FrameSystemConfigResponse
    >(robotService.frameSystemConfig.bind(robotService), request);
    return response.getFrameSystemConfigsList();
  }

  async transformPose(
    source: PoseInFrame,
    destination: string,
    supplementalTransforms: Transform[]
  ) {
    const robotService = this.robotService;
    const request = new proto.TransformPoseRequest();
    request.setSource(source);
    request.setDestination(destination);
    request.setSupplementalTransformsList(supplementalTransforms);
    const response = await promisify<
      proto.TransformPoseRequest,
      proto.TransformPoseResponse
    >(robotService.transformPose.bind(robotService), request);
    const result = response.getPose();
    if (!result) {
      // eslint-disable-next-line no-warning-comments
      // TODO: Can the response frame be undefined or null?
      throw new Error('no pose');
    }
    return result;
  }

  async transformPCD(
    pointCloudPCD: Uint8Array,
    source: string,
    destination: string
  ) {
    const robotService = this.robotService;
    const request = new proto.TransformPCDRequest();
    request.setPointCloudPcd(pointCloudPCD);
    request.setSource(source);
    request.setDestination(destination);
    const response = await promisify<
      proto.TransformPCDRequest,
      proto.TransformPCDResponse
    >(robotService.transformPCD.bind(robotService), request);
    return response.getPointCloudPcd_asU8();
  }

  // DISCOVERY

  async discoverComponents(queries: proto.DiscoveryQuery[]) {
    const robotService = this.robotService;
    const request = new proto.DiscoverComponentsRequest();
    request.setQueriesList(queries);
    const response = await promisify<
      proto.DiscoverComponentsRequest,
      proto.DiscoverComponentsResponse
    >(robotService.discoverComponents.bind(robotService), request);
    return response.getDiscoveryList();
  }

  // RESOURCES

  async resourceNames() {
    const robotService = this.robotService;
    const request = new proto.ResourceNamesRequest();
    const response = await promisify<
      proto.ResourceNamesRequest,
      proto.ResourceNamesResponse
    >(robotService.resourceNames.bind(robotService), request);
    return response.getResourcesList();
  }

  async resourceRPCSubtypes() {
    const robotService = this.robotService;
    const request = new proto.ResourceRPCSubtypesRequest();
    const response = await promisify<
      proto.ResourceRPCSubtypesRequest,
      proto.ResourceRPCSubtypesResponse
    >(robotService.resourceRPCSubtypes.bind(robotService), request);
    return response.getResourceRpcSubtypesList();
  }

  // STATUS

  async getStatus(resourceNames: ResourceName[]) {
    const robotService = this.robotService;
    const request = new proto.GetStatusRequest();
    request.setResourceNamesList(resourceNames);
    const response = await promisify<
      proto.GetStatusRequest,
      proto.GetStatusResponse
    >(robotService.getStatus.bind(robotService), request);
    return response.getStatusList();
  }

  async streamStatus(resourceNames: ResourceName[], duration: Duration) {
    const robotService = this.robotService;
    const request = new proto.StreamStatusRequest();
    request.setResourceNamesList(resourceNames);
    request.setEvery(duration);
    const response = await promisify<
      proto.StreamStatusRequest,
      proto.StreamStatusResponse
    >(robotService.streamStatus.bind(robotService), request);
    return response.getStatusList();
  }
}
