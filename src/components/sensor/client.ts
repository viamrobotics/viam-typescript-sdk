import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { GetReadingsRequest } from '../../gen/common/v1/common_pb';
import { SensorService } from '../../gen/component/sensor/v1/sensor_connect';
import { doCommandFromClient } from '../../utils';
import type { Sensor } from './sensor';

/**
 * A gRPC-web client for the Sensor component.
 *
 * @group Clients
 */
export class SensorClient implements Sensor {
  private client: PromiseClient<typeof SensorService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SensorService);
    this.name = name;
    this.options = options;
  }

  async getReadings(extra = {}, callOptions = this.callOptions) {
    const request = new GetReadingsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getReadings(request, callOptions);

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

  async doCommand(
    command: Struct,
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
