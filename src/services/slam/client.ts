import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { SLAMService } from '../../gen/service/slam/v1/slam_connect';
import {
  GetInternalStateRequest,
  GetPointCloudMapRequest,
  GetPositionRequest,
  GetPropertiesRequest,
} from '../../gen/service/slam/v1/slam_pb';
import { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Slam } from './slam';

/**
 * A gRPC-web client for a SLAM service.
 *
 * @group Clients
 */
export class SlamClient implements Slam {
  private client: PromiseClient<typeof SLAMService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SLAMService);
    this.name = name;
    this.options = options;
  }

  async getPosition(callOptions = this.callOptions) {
    const request = new GetPositionRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getPosition(request, callOptions);
  }

  async getPointCloudMap(
    returnEditedMap?: boolean,
    callOptions = this.callOptions
  ): Promise<Uint8Array> {
    const request = new GetPointCloudMapRequest({
      name: this.name,
      returnEditedMap,
    });
    this.options.requestLogger?.(request);

    const chunks: Uint8Array[] = [];
    const stream = this.client.getPointCloudMap(request, callOptions);
    for await (const chunk of stream) {
      chunks.push(chunk.pointCloudPcdChunk);
    }
    return concatArrayU8(chunks);
  }

  async getInternalState(
    callOptions = this.callOptions
  ): Promise<Uint8Array> {
    const request = new GetInternalStateRequest({
      name: this.name,
    });
    this.options.requestLogger?.(request);

    const chunks: Uint8Array[] = [];
    const stream = this.client.getInternalState(request, callOptions);
    for await (const chunk of stream) {
      chunks.push(chunk.internalStateChunk);
    }
    return concatArrayU8(chunks);
  }

  async getProperties(callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
  }

  async doCommand(
    command: Struct,
    callOptions = this.callOptions
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
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
