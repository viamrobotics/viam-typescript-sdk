import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
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

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotorService);
    this.name = name;
    this.options = options;
  }

  async setPower(power: number, extra = {}) {
    const request = new SetPowerRequest({
      name: this.name,
      powerPct: power,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPower(request);
  }

  async goFor(rpm: number, revolutions: number, extra = {}) {
    const request = new GoForRequest({
      name: this.name,
      rpm,
      revolutions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.goFor(request);
  }

  async goTo(rpm: number, positionRevolutions: number, extra = {}) {
    const request = new GoToRequest({
      name: this.name,
      rpm,
      positionRevolutions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.goTo(request);
  }

  async setRPM(rpm: number, extra = {}) {
    const request = new SetRPMRequest({
      name: this.name,
      rpm,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setRPM(request);
  }

  async resetZeroPosition(offset: number, extra = {}) {
    const request = new ResetZeroPositionRequest({
      name: this.name,
      offset,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.resetZeroPosition(request);
  }

  async stop(extra = {}) {
    const request = new StopRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request);
  }

  async getProperties(extra = {}) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getProperties(request);
    return {
      positionReporting: resp.positionReporting,
    };
  }

  async getPosition(extra = {}) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request);
    return resp.position;
  }

  async isPowered(extra = {}) {
    const request = new IsPoweredRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.isPowered(request);
    return [response.isOn, response.powerPct] as const;
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
