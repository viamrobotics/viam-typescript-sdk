import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
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
import type { Options, StructInput, Vector3 } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Base } from './base';
import { GetGeometriesRequest } from '../../gen/common/v1/common_pb';

/**
 * A gRPC-web client for the Base component.
 *
 * @group Clients
 */
export class BaseClient implements Base {
  private client: Client<typeof BaseService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(BaseService);
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

  async moveStraight(
    distanceMm: number,
    mmPerSec: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new MoveStraightRequest({
      name: this.name,
      mmPerSec,
      distanceMm: distanceMm ? BigInt(distanceMm) : undefined,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.moveStraight(request, callOptions);
  }

  async spin(
    angleDeg: number,
    degsPerSec: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SpinRequest({
      name: this.name,
      angleDeg,
      degsPerSec,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.spin(request, callOptions);
  }

  async setPower(
    linear: Vector3,
    angular: Vector3,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetPowerRequest({
      name: this.name,
      linear,
      angular,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPower(request, callOptions);
  }

  async setVelocity(
    linear: Vector3,
    angular: Vector3,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetVelocityRequest({
      name: this.name,
      linear,
      angular,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setVelocity(request, callOptions);
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
    command: StructInput,
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

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
  }
}
