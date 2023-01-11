import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb'

import type Client from '../../Client'
import type { Sensor } from './Sensor'
import { SensorServiceClient } from '../../gen/component/sensor/v1/sensor_pb_service'

import { promisify } from '../../utils'
import { sensorApi } from '../../main'


export class SensorClient implements Sensor {
  private client: SensorServiceClient
  private name: string

  constructor (client: Client, name: string) {
    this.client = client.createServiceClient(SensorServiceClient)
    this.name = name
  }

  private get sensorService () {
    return this.client
  }
  async GetReadings (extra = {}) {
    const sensorService = this.sensorService
    const request = new sensorApi.GetReadingsRequest()
    request.setName(this.name)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<sensorApi.GetReadingsRequest, sensorApi.GetReadingsResponse>(
      sensorService.getReadings.bind(sensorService),
      request
    )
    return response
  }
}
