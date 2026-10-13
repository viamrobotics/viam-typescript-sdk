import { type JsonObject, type JsonValue, create, toJson } from '@bufbuild/protobuf';
import { ValueSchema } from '@bufbuild/protobuf/wkt';

import type { CallOptions, Client } from '@connectrpc/connect';
import { GetReadingsRequestSchema } from '../../gen/common/v1/common_pb';
import {
  PowerSensorService,
  GetCurrentRequestSchema,
  GetPowerRequestSchema,
  GetVoltageRequestSchema,
} from '../../gen/component/powersensor/v1/powersensor_pb';

import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { PowerSensor } from './power-sensor';

/**
 * A gRPC-web client for the PowerSensor component.
 *
 * @group Clients
 */

export class PowerSensorClient implements PowerSensor {
  private client: Client<typeof PowerSensorService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(PowerSensorService);
    this.name = name;
    this.options = options;
  }

  async getVoltage(extra = {}, callOptions = this.callOptions) {
    const request = create(GetVoltageRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getVoltage(request, callOptions);

    return [response.volts, response.isAc] as const;
  }

  async getCurrent(extra = {}, callOptions = this.callOptions) {
    const request = create(GetCurrentRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getCurrent(request, callOptions);

    return [response.amperes, response.isAc] as const;
  }

  async getPower(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPowerRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPower(request, callOptions);
    return resp.watts;
  }

  async getReadings(extra = {}, callOptions = this.callOptions) {
    const request = create(GetReadingsRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getReadings(request, callOptions);

    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(response.readings)) {
      const value = response.readings[key];
      if (!value) {
        continue;
      }
      result[key] = toJson(ValueSchema, value);
    }
    return result;
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonValue> {
    return getStatusFromClient(this.client.getStatus, this.name, this.options, callOptions);
  }

  async doCommand(
    command: JsonObject | Record<string, JsonValue>,
    callOptions = this.callOptions,
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
