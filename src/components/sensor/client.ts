import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

import type { RobotClient } from '../../robot';
import type { Options, StructType } from '../../types';
import { SensorServiceClient } from '../../gen/component/sensor/v1/sensor_pb_service';

import { promisify, doCommandFromClient } from '../../utils';
import {
  GetReadingsRequest,
  GetReadingsResponse,
} from '../../gen/common/v1/common_pb';
import type { Sensor } from './sensor';

/**
 * A gRPC-web client for the Sensor component.
 *
 * @group Clients
 */
export class SensorClient implements Sensor {
  private client: SensorServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SensorServiceClient);
    this.name = name;
    this.options = options;
  }

  private get sensorService() {
    return this.client;
  }

  async getReadings(extra = {}) {
    const { sensorService } = this;
    const request = new GetReadingsRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<GetReadingsRequest, GetReadingsResponse>(
      sensorService.getReadings.bind(sensorService),
      request
    );

    const result: Record<string, unknown> = {};
    for (const [key, value] of response.getReadingsMap().entries()) {
      result[key] = value.toJavaScript();
    }
    return result;
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { sensorService } = this;
    return doCommandFromClient(sensorService, this.name, command, this.options);
  }
}
