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

  getPointCloudMap = async (): Promise<Uint8Array> => {
    const request = new pb.GetPointCloudMapRequest();
    request.setName(this.name);
    this.options.requestLogger?.(request);

    const chunks: Uint8Array[] = [];
    const stream = this.client.getPointCloudMap(request);

    stream.on('data', (response) => {
      const chunk = response.getPointCloudPcdChunk_asU8();
      chunks.push(chunk);
    });

    return new Promise<Uint8Array>((resolve, reject) => {
      stream.on('status', (status) => {
        if (status.code !== 0) {
          const error = {
            message: status.details,
            code: status.code,
            metadata: status.metadata,
          };
          reject(error);
        }
      });

      stream.on('end', (end) => {
        if (end === undefined) {
          const error = { message: 'Stream ended without a status code' };
          reject(error);
        } else if (end.code !== 0) {
          const error = {
            message: end.details,
            code: end.code,
            metadata: end.metadata,
          };
          reject(error);
        }
        const arr = concatArrayU8(chunks);
        resolve(arr);
      });
    });
  };

  getInternalState = async (): Promise<Uint8Array> => {
    const request = new pb.GetInternalStateRequest();
    request.setName(this.name);
    this.options.requestLogger?.(request);

    const chunks: Uint8Array[] = [];
    const stream = this.client.getInternalState(request);

    stream.on('data', (response) => {
      const chunk = response.getInternalStateChunk_asU8();
      chunks.push(chunk);
    });

    return new Promise<Uint8Array>((resolve, reject) => {
      stream.on('status', (status) => {
        if (status.code !== 0) {
          const error = {
            message: status.details,
            code: status.code,
            metadata: status.metadata,
          };
          reject(error);
        }
      });

      stream.on('end', (end) => {
        if (end === undefined) {
          const error = { message: 'Stream ended without a status code' };
          reject(error);
        } else if (end.code !== 0) {
          const error = {
            message: end.details,
            code: end.code,
            metadata: end.metadata,
          };
          reject(error);
        }
        const arr = concatArrayU8(chunks);
        resolve(arr);
      });
    });
  };

  async getLatestMapInfo() {
    const { service } = this;

    const request = new pb.GetLatestMapInfoRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetLatestMapInfoRequest,
      pb.GetLatestMapInfoResponse
    >(service.getLatestMapInfo.bind(service), request);

    const timestamp = response.getLastMapUpdate();
    if (!timestamp) {
      throw new Error('no map update');
    }
    return new Date(timestamp.getSeconds() * 1e3 + timestamp.getNanos() / 1e6);
  }

  async getProperties() {
    const { service } = this;

    const request = new pb.GetPropertiesRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPropertiesRequest,
      pb.GetPropertiesResponse
    >(service.getProperties.bind(service), request);

    return response.toObject();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { service } = this;
    return doCommandFromClient(service, this.name, command, this.options);
  }
}

const concatArrayU8 = (arrays: Uint8Array[]) => {
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new Uint8Array(totalLength);
  let length = 0;
  for (const array of arrays) {
    result.set(array, length);
    length += array.length;
  }
  return result;
};
