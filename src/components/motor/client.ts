import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  GetPositionRequestSchema,
  GetPropertiesRequestSchema,
  GoForRequestSchema,
  GoToRequestSchema,
  IsMovingRequestSchema,
  IsPoweredRequestSchema,
  MotorService,
  ResetZeroPositionRequestSchema,
  SetPowerRequestSchema,
  SetRPMRequestSchema,
  StopRequestSchema,
} from "../../gen/component/motor/v1/motor_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { Motor } from "./motor";

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
    const request = create(SetPowerRequestSchema, {
      name: this.name,
      powerPct: power,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.setPower(request, callOptions);
  }

  async goFor(
    rpm: number,
    revolutions: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GoForRequestSchema, {
      name: this.name,
      rpm,
      revolutions,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.goFor(request, callOptions);
  }

  async goTo(
    rpm: number,
    positionRevolutions: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GoToRequestSchema, {
      name: this.name,
      rpm,
      positionRevolutions,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.goTo(request, callOptions);
  }

  async setRPM(rpm: number, extra = {}, callOptions = this.callOptions) {
    const request = create(SetRPMRequestSchema, {
      name: this.name,
      rpm,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.setRPM(request, callOptions);
  }

  async resetZeroPosition(
    offset: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(ResetZeroPositionRequestSchema, {
      name: this.name,
      offset,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.resetZeroPosition(request, callOptions);
  }

  async stop(extra = {}, callOptions = this.callOptions) {
    const request = create(StopRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request, callOptions);
  }

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPropertiesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getProperties(request, callOptions);
    return {
      positionReporting: resp.positionReporting,
    };
  }

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPositionRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    return resp.position;
  }

  async isPowered(extra = {}, callOptions = this.callOptions) {
    const request = create(IsPoweredRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.isPowered(request, callOptions);
    return [response.isOn, response.powerPct] as const;
  }

  async isMoving(callOptions = this.callOptions) {
    const request = create(IsMovingRequestSchema, {
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isMoving(request, callOptions);
    return resp.isMoving;
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions,
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions,
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
