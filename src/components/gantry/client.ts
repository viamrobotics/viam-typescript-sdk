import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { GantryService } from '../../gen/component/gantry/v1/gantry_connect';
import {
  GetLengthsRequest,
  GetPositionRequest,
  HomeRequest,
  IsMovingRequest,
  MoveToPositionRequest,
  StopRequest,
} from '../../gen/component/gantry/v1/gantry_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Gantry } from './gantry';

/**
 * A gRPC-web client for the Gantry component.
 *
 * @group Clients
 */
export class GantryClient implements Gantry {
  private client: PromiseClient<typeof GantryService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GantryService);
    this.name = name;
    this.options = options;
  }

  async getPosition(extra = {}) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request);
    return resp.positionsMm;
  }

  async moveToPosition(
    positionsMm: number[],
    speedsMmPerSec: number[],
    extra = {}
  ) {
    const request = new MoveToPositionRequest({
      name: this.name,
      positionsMm,
      speedsMmPerSec,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.moveToPosition(request);
  }

  async home(extra = {}) {
    const request = new HomeRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.home(request);
    return resp.homed;
  }

  async getLengths(extra = {}) {
    const request = new GetLengthsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getLengths(request);
    return resp.lengthsMm;
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
