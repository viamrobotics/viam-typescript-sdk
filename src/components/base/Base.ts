/* eslint-disable @typescript-eslint/no-explicit-any */

import type { baseApi, commonApi } from '../../main'

export interface Base {
  moveStraight(distanceMm: number, mmPerSec: number, extra?: Map<string, any>): Promise<baseApi.MoveStraightResponse>
  spin(angleDeg: number, degsPerSec: number, extra?: Map<string, any>): Promise<baseApi.SpinResponse>
  setPower(linear: commonApi.Vector3, angular: commonApi.Vector3, extra?: Map<string, any>): Promise<baseApi.SetPowerResponse>
  setVelocity(linear: commonApi.Vector3, angular: commonApi.Vector3, extra?: Map<string, any>): Promise<baseApi.SetVelocityResponse>
  stop(extra?: Map<string, any>): Promise<baseApi.StopResponse>
}
