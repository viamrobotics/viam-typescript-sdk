import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb'

import type Client from '../../Client'
import type { Options } from '../../types'
import type { Sensor } from './Sensor'
import { SensorServiceClient } from '../../gen/component/sensor/v1/sensor_pb_service.esm'

import { promisify } from '../../utils'
import { sensorApi } from '../../main'

export class SensorClient implements Sensor {
  private client: SensorServiceClient
  private readonly name: string
  private readonly options: Options

  constructor (client: Client, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SensorServiceClient)
    this.name = name
    this.options = options
  }

  private get sensorService () {
    return this.client
  }
  async getReadings (extra = {}) {
    const sensorService = this.sensorService
    const request = new sensorApi.GetReadingsRequest()
    request.setName(this.name)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    const response = await promisify<sensorApi.GetReadingsRequest, sensorApi.GetReadingsResponse>(
      sensorService.getReadings.bind(sensorService),
      request
    )
    return response
  }
}
