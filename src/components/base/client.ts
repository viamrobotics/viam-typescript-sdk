import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb'
import { Client, baseApi, commonApi } from '../../main'
import type { Base } from './Base'
import { BaseServiceClient } from '../../gen/component/base/v1/base_pb_service.esm'
import { promisify } from '../../utils'


export class BaseClient implements Base {
  private client: BaseServiceClient
  private name: string

  constructor (client: Client, name:string) {
    this.client = client.createServiceClient(BaseServiceClient)
    this.name = name
  }

  private get baseClient () {
    return this.client
  }

  async moveStraight (distanceMm: number, mmPerSec: number, extra = {}) {
    const bc = this.baseClient
    const req = new baseApi.MoveStraightRequest()
    req.setName(this.name)
    req.setMmPerSec(mmPerSec)
    req.setDistanceMm(distanceMm)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const resultProm = await promisify<baseApi.MoveStraightRequest, baseApi.MoveStraightResponse>(
      bc.moveStraight.bind(bc),
      req
    )
    return resultProm
  }

  async spin (angleDeg:number, degsPerSec:number, extra = {}) {
    const bc = this.baseClient
    const req = new baseApi.SpinRequest()
    req.setName(this.name)
    req.setAngleDeg(angleDeg)
    req.setDegsPerSec(degsPerSec)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const resultProm = await promisify<baseApi.SpinRequest, baseApi.SpinResponse>(
      bc.spin.bind(bc),
      req
    )

    return resultProm
  }
  async setPower (linear:commonApi.Vector3, angular:commonApi.Vector3, extra = {}) {
    const bc = this.baseClient
    const req = new baseApi.SetPowerRequest()
    req.setName(this.name)
    req.setLinear(linear)
    req.setAngular(angular)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const resultProm = await promisify<baseApi.SetPowerRequest, baseApi.SetPowerResponse>(
      bc.setPower.bind(bc),
      req
    )

    return resultProm
  }

  async setVelocity (linear:commonApi.Vector3, angular:commonApi.Vector3, extra = {}) {
    const bc = this.baseClient
    const req = new baseApi.SetVelocityRequest()
    req.setName(this.name)
    req.setLinear(linear)
    req.setAngular(angular)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const resultProm = await promisify<baseApi.SetVelocityRequest, baseApi.SetVelocityResponse>(
      bc.setVelocity.bind(bc),
      req
    )

    return resultProm
  }

  async stop (extra = {}) {
    const bc = this.baseClient
    const req = new baseApi.StopRequest()
    req.setName(this.name)
    req.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const resultProm = await promisify<baseApi.StopRequest, baseApi.StopResponse>(
      bc.stop.bind(bc),
      req
    )
    return resultProm
  }
}
