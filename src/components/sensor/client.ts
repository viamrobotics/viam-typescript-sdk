import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { type JsonObject, type JsonValue, create, toJson } from '@bufbuild/protobuf';
import { ValueSchema } from '@bufbuild/protobuf/wkt';

import type { CallOptions, Client } from '@connectrpc/connect';
import { GetReadingsRequestSchema } from '../../gen/common/v1/common_pb';
import { SensorService } from '../../gen/component/sensor/v1/sensor_pb';
import { doCommandFromClient, getGeometriesFromClient, getStatusFromClient } from '../../utils';
import type { Sensor } from './sensor';

/**
 * A gRPC-web client for the Sensor component.
 *
 * @group Clients
 */
export class SensorClient implements Sensor {
  private client: Client<typeof SensorService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SensorService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    return getGeometriesFromClient(this.client.getGeometries, this.name, extra, callOptions);
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
