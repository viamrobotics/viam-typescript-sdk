import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
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
import type { Options, StructInput } from '../../types';
import {
  doCommandFromClient,
  getKinematicsFromClient,
  getGeometriesFromClient,
} from '../../utils';
import type { Gantry } from './gantry';
import type { GetKinematicsResult } from '../../utils';

/**
 * A gRPC-web client for the Gantry component.
 *
 * @group Clients
 */
export class GantryClient implements Gantry {
  private client: Client<typeof GantryService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GantryService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    return getGeometriesFromClient(
      this.client.getGeometries,
      this.name,
      Struct.fromJson(extra),
      callOptions
    );
  }

  async getKinematics(
    extra = {},
    callOptions = this.callOptions
  ): Promise<GetKinematicsResult> {
    return getKinematicsFromClient(
      this.client.getKinematics,
      this.name,
      Struct.fromJson(extra),
      callOptions
    );
  }

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    return resp.positionsMm;
  }

  async moveToPosition(
    positionsMm: number[],
    speedsMmPerSec: number[],
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new MoveToPositionRequest({
      name: this.name,
      positionsMm,
      speedsMmPerSec,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.moveToPosition(request, callOptions);
  }

  async home(extra = {}, callOptions = this.callOptions) {
    const request = new HomeRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.home(request, callOptions);
    return resp.homed;
  }

  async getLengths(extra = {}, callOptions = this.callOptions) {
    const request = new GetLengthsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getLengths(request, callOptions);
    return resp.lengthsMm;
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
}
