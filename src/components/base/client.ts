import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { BaseService } from '../../gen/component/base/v1/base_connect';
import {
  GetPropertiesRequest,
  IsMovingRequest,
  MoveStraightRequest,
  SetPowerRequest,
  SetVelocityRequest,
  SpinRequest,
  StopRequest,
} from '../../gen/component/base/v1/base_pb';
import type { RobotClient } from '../../robot';
import type { Options, Vector3 } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Base } from './base';

/**
 * A gRPC-web client for the Base component.
 *
 * @group Clients
 */
export class BaseClient implements Base {
  private client: PromiseClient<typeof BaseService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(BaseService);
    this.name = name;
    this.options = options;
  }

  async moveStraight(distanceMm: number, mmPerSec: number, extra = {}) {
    const request = new MoveStraightRequest({
      name: this.name,
      mmPerSec,
      distanceMm: distanceMm ? BigInt(distanceMm) : undefined,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.moveStraight(request);
  }

  async spin(angleDeg: number, degsPerSec: number, extra = {}) {
    const request = new SpinRequest({
      name: this.name,
      angleDeg,
      degsPerSec,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.spin(request);
  }

  async setPower(linear: Vector3, angular: Vector3, extra = {}) {
    const request = new SetPowerRequest({
      name: this.name,
      linear,
      angular,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPower(request);
  }

  async setVelocity(linear: Vector3, angular: Vector3, extra = {}) {
    const request = new SetVelocityRequest({
      name: this.name,
      linear,
      angular,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setVelocity(request);
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

  async getProperties(extra = {}) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request);
  }
}
