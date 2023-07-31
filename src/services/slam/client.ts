import pb from '../../gen/service/slam/v1/slam_pb';
import { SLAMServiceClient } from '../../gen/service/slam/v1/slam_pb_service';
import { RobotClient } from '../../robot';
import type { Options, StructType } from '../../types';
import { doCommandFromClient, promisify } from '../../utils';
import type { Slam } from './slam';

/**
 * A gRPC-web client for a SLAM service.
 *
 * @group Clients
 */
export class SlamClient implements Slam {
  private client: SLAMServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SLAMServiceClient);
    this.name = name;
    this.options = options;
  }

  private get service() {
    return this.client;
  }

  async getPosition() {
    const { service } = this;

    const request = new pb.GetPositionRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPositionRequest,
      pb.GetPositionResponse
    >(service.getPosition.bind(service), request);

    return response.toObject();
  }

  async getPointCloudMap() {
    const { service } = this;

    const request = new pb.GetPointCloudMapRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPointCloudMapRequest,
      pb.GetPointCloudMapResponse
    >(service.getPointCloudMap.bind(service), request);

    return response.getPointCloudPcdChunk();
  }

  async getInternalState() {
    const { service } = this;

    const request = new pb.GetInternalStateRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetInternalStateRequest,
      pb.GetInternalStateResponse
    >(service.getInternalState.bind(service), request);

    return response.getInternalStateChunk();
  }

  async getLatestMapInfo() {
    const { service } = this;

    const request = new pb.GetLatestMapInfoRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetLatestMapInfoRequest,
      pb.GetLatestMapInfoResponse
    >(service.getLatestMapInfo.bind(service), request);

    const result = response.getLastMapUpdate();
    if (!result) {
      throw new Error('no map update');
    }
    return result.toObject();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { service } = this;
    return doCommandFromClient(service, this.name, command, this.options);
  }
}
