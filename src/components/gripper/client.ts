import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { GripperService } from '../../gen/component/gripper/v1/gripper_connect';
import {
  GrabRequest,
  IsMovingRequest,
  OpenRequest,
  StopRequest,
} from '../../gen/component/gripper/v1/gripper_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Gripper } from './gripper';
import { GetGeometriesRequest } from '../../gen/common/v1/common_pb';

/**
 * A gRPC-web client for the Gripper component.
 *
 * @group Clients
 */
export class GripperClient implements Gripper {
  private client: PromiseClient<typeof GripperService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GripperService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    const request = new GetGeometriesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    const response = await this.client.getGeometries(request, callOptions);
    return response.geometries;
  }

  async open(extra = {}, callOptions = this.callOptions) {
    const request = new OpenRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.open(request, callOptions);
  }

  async grab(extra = {}, callOptions = this.callOptions) {
    const request = new GrabRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.grab(request, callOptions);
  }

  async stop(extra = {}, callOptions = this.callOptions) {
    const request = new StopRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request, callOptions);
  }

  async isMoving(callOptions = this.callOptions) {
    const request = new IsMovingRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isMoving(request, callOptions);
    return resp.isMoving;
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
