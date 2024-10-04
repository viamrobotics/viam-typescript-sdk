import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
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

/**
 * A gRPC-web client for the Gripper component.
 *
 * @group Clients
 */
export class GripperClient implements Gripper {
  private client: PromiseClient<typeof GripperService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GripperService);
    this.name = name;
    this.options = options;
  }

  async open(extra = {}) {
    const request = new OpenRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.open(request);
  }

  async grab(extra = {}) {
    const request = new GrabRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.grab(request);
  }

  async stop(extra = {}) {
    const request = new StopRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request);
  }

  async isMoving() {
    const request = new IsMovingRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isMoving(request);
    return resp.isMoving;
  }

  async doCommand(command: Struct): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options
    );
  }
}
