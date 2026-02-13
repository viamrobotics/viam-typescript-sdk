import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { MotorService } from '../../gen/component/motor/v1/motor_connect';
import {
  GetPositionRequest,
  GetPropertiesRequest,
  GoForRequest,
  GoToRequest,
  IsMovingRequest,
  IsPoweredRequest,
  ResetZeroPositionRequest,
  SetPowerRequest,
  SetRPMRequest,
  StopRequest,
} from '../../gen/component/motor/v1/motor_pb';
import type { RobotClient } from '../../robot';
import type { Options, StructInput } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Motor } from './motor';

/**
 * A gRPC-web client for the Motor component.
 *
 * @group Clients
 */
export class MotorClient implements Motor {
  private client: Client<typeof MotorService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotorService);
    this.name = name;
    this.options = options;
  }

  async setPower(power: number, extra = {}, callOptions = this.callOptions) {
    const request = new SetPowerRequest({
      name: this.name,
      powerPct: power,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPower(request, callOptions);
  }

  async goFor(
    rpm: number,
    revolutions: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GoForRequest({
      name: this.name,
      rpm,
      revolutions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.goFor(request, callOptions);
  }

  async goTo(
    rpm: number,
    positionRevolutions: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GoToRequest({
      name: this.name,
      rpm,
      positionRevolutions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.goTo(request, callOptions);
  }

  async setRPM(rpm: number, extra = {}, callOptions = this.callOptions) {
    const request = new SetRPMRequest({
      name: this.name,
      rpm,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setRPM(request, callOptions);
  }

  async resetZeroPosition(
    offset: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new ResetZeroPositionRequest({
      name: this.name,
      offset,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.resetZeroPosition(request, callOptions);
  }

  async stop(extra = {}, callOptions = this.callOptions) {
    const request = new StopRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request, callOptions);
  }

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getProperties(request, callOptions);
    return {
      positionReporting: resp.positionReporting,
    };
  }

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    return resp.position;
  }

  async isPowered(extra = {}, callOptions = this.callOptions) {
    const request = new IsPoweredRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.isPowered(request, callOptions);
    return [response.isOn, response.powerPct] as const;
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
