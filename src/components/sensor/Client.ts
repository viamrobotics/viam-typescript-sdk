import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb';

import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import type { Sensor } from './Sensor';
import { SensorServiceClient } from '../../gen/component/sensor/v1/sensor_pb_service.esm';

import { promisify } from '../../utils';
import sensorApi from '../../gen/component/sensor/v1/sensor_pb.esm';

/** A gRPC-web client for the Sensor component. */
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
    const sensorService = this.sensorService;
    const request = new sensorApi.GetReadingsRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      sensorApi.GetReadingsRequest,
      sensorApi.GetReadingsResponse
    >(sensorService.getReadings.bind(sensorService), request);

    const result: Record<string, unknown> = {};
    for (const [key, value] of response.getReadingsMap().entries()) {
      result[key] = value.toJavaScript();
    }
    return result;
  }
}
