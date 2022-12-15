import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb'
import type Client from '../../Client'
import type { Motor } from './Motor'
import { MotorServiceClient } from '../../gen/component/motor/v1/motor_pb_service.esm'
import { motorApi } from '../../main'
import { promisify } from '../../utils'

export class MotorClient implements Motor {
  private client: MotorServiceClient
  private name: string

  constructor (client: Client, name:string) {
    this.client = client.createServiceClient(MotorServiceClient)
    this.name = name
  }

  private get motorClient () {
    return this.client
  }

  async setPower (power: number, extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.SetPowerRequest()
    req.setName(this.name)
    req.setPowerPct(power)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.SetPowerRequest, motorApi.SetPowerResponse>(
      mc.setPower.bind(mc),
      req
    )
    return result
  }

  async goFor (rpm:number, revolutions:number, extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.GoForRequest()
    req.setName(this.name)
    req.setRpm(rpm)
    req.setRevolutions(revolutions)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.GoForRequest, motorApi.GoForResponse>(
      mc.goFor.bind(mc),
      req
    )
    return result
  }

  async goTo (rpm:number, positionRevolutions:number, extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.GoToRequest()
    req.setName(this.name)
    req.setRpm(rpm)
    req.setPositionRevolutions(positionRevolutions)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.GoToRequest, motorApi.GoToResponse>(
      mc.goTo.bind(mc),
      req
    )
    return result
  }

  async resetZeroPosition (offset:number, extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.ResetZeroPositionRequest()
    req.setName(this.name)
    req.setOffset(offset)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.ResetZeroPositionRequest, motorApi.ResetZeroPositionResponse>(
      mc.resetZeroPosition.bind(mc),
      req
    )
    return result
  }

  async motorStop (extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.StopRequest()
    req.setName(this.name)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.StopRequest, motorApi.StopResponse>(
      mc.stop.bind(mc),
      req
    )
    return result
  }

  async getProperties (extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.GetPropertiesRequest()
    req.setName(this.name)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.GetPropertiesRequest, motorApi.GetPropertiesResponse>(
      mc.getProperties.bind(mc),
      req
    )
    return { positionReporting: result.getPositionReporting() }
  }

  async getPosition (extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.GetPositionRequest()
    req.setName(this.name)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.GetPositionRequest, motorApi.GetPositionResponse>(
      mc.getPosition.bind(mc),
      req
    )
    return result.getPosition()
  }

  async isPowered (extra = {}) {
    const mc = this.motorClient
    const req = new motorApi.IsPoweredRequest()
    req.setName(this.name)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const result = await promisify<motorApi.IsPoweredRequest, motorApi.IsPoweredResponse>(
      mc.isPowered.bind(mc),
      req
    )
    return [result.getIsOn(), result.getPowerPct()]
  }
}

