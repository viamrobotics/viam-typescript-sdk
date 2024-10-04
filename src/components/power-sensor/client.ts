import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { GetReadingsRequest } from '../../gen/common/v1/common_pb';
import { PowerSensorService } from '../../gen/component/powersensor/v1/powersensor_connect';
import {
  GetCurrentRequest,
  GetPowerRequest,
  GetVoltageRequest,
} from '../../gen/component/powersensor/v1/powersensor_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { PowerSensor } from './power-sensor';

/**
 * A gRPC-web client for the PowerSensor component.
 *
 * @group Clients
 */

export class PowerSensorClient implements PowerSensor {
  private client: PromiseClient<typeof PowerSensorService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(PowerSensorService);
    this.name = name;
    this.options = options;
  }

  async getVoltage(extra = {}) {
    const request = new GetVoltageRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getVoltage(request);

    return [response.volts, response.isAc] as const;
  }

  async getCurrent(extra = {}) {
    const request = new GetCurrentRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getCurrent(request);

    return [response.amperes, response.isAc] as const;
  }

  async getPower(extra = {}) {
    const request = new GetPowerRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPower(request);
    return resp.watts;
  }

  async getReadings(extra = {}) {
    const request = new GetReadingsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getReadings(request);

    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(response.readings)) {
      const value = response.readings[key];
      if (!value) {
        continue;
      }
      result[key] = value.toJson();
    }
    return result;
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
