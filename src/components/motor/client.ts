import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
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
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Motor } from './motor';

/**
 * A gRPC-web client for the Motor component.
 *
 * @group Clients
 */
export class MotorClient implements Motor {
  private client: PromiseClient<typeof MotorService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotorService);
    this.name = name;
    this.options = options;
  }

  async setPower(power: number, extra = {}, callOptions?: CallOptions) {
    const request = new SetPowerRequest({
      name: this.name,
      powerPct: power,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPower(request, callOptions || this.callOptions);
  }

  async goFor(
    rpm: number,
    revolutions: number,
    extra = {},
    callOptions?: CallOptions
  ) {
    const request = new GoForRequest({
      name: this.name,
      rpm,
      revolutions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.goFor(request, callOptions || this.callOptions);
  }

  async goTo(
    rpm: number,
    positionRevolutions: number,
    extra = {},
    callOptions?: CallOptions
  ) {
    const request = new GoToRequest({
      name: this.name,
      rpm,
      positionRevolutions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.goTo(request, callOptions || this.callOptions);
  }

  async setRPM(rpm: number, extra = {}, callOptions?: CallOptions) {
    const request = new SetRPMRequest({
      name: this.name,
      rpm,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setRPM(request, callOptions || this.callOptions);
  }

  async resetZeroPosition(
    offset: number,
    extra = {},
    callOptions?: CallOptions
  ) {
    const request = new ResetZeroPositionRequest({
      name: this.name,
      offset,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.resetZeroPosition(
      request,
      callOptions || this.callOptions
    );
  }

  async stop(extra = {}, callOptions?: CallOptions) {
    const request = new StopRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request, callOptions || this.callOptions);
  }

  async getProperties(extra = {}, callOptions?: CallOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getProperties(
      request,
      callOptions || this.callOptions
    );
    return {
      positionReporting: resp.positionReporting,
    };
  }

  async getPosition(extra = {}, callOptions?: CallOptions) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(
      request,
      callOptions || this.callOptions
    );
    return resp.position;
  }

  async isPowered(extra = {}, callOptions?: CallOptions) {
    const request = new IsPoweredRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.isPowered(
      request,
      callOptions || this.callOptions
    );
    return [response.isOn, response.powerPct] as const;
  }

  async isMoving(callOptions?: CallOptions) {
    const request = new IsMovingRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isMoving(
      request,
      callOptions || this.callOptions
    );
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
