import type { baseApi, commonApi } from '../../main'
import type { Extra } from '../../types'

export interface Base {
  moveStraight(distanceMm: number, mmPerSec: number, extra?: Extra): Promise<baseApi.MoveStraightResponse>
  spin(angleDeg: number, degsPerSec: number, extra?: Extra): Promise<baseApi.SpinResponse>
  setPower(linear: commonApi.Vector3, angular: commonApi.Vector3, extra?: Extra): Promise<baseApi.SetPowerResponse>
  setVelocity(linear: commonApi.Vector3, angular: commonApi.Vector3, extra?: Extra): Promise<baseApi.SetVelocityResponse>
  stop(extra?: Extra): Promise<baseApi.StopResponse>
}
