import type { Extra } from '../../types'
import type { commonApi } from '../../main'

export interface Base {
  moveStraight(
    distanceMm: number,
    mmPerSec: number,
    extra?: Extra
  ): Promise<void>
  spin(angleDeg: number, degsPerSec: number, extra?: Extra): Promise<void>
  setPower(
    linear: commonApi.Vector3,
    angular: commonApi.Vector3,
    extra?: Extra
  ): Promise<void>
  setVelocity(
    linear: commonApi.Vector3,
    angular: commonApi.Vector3,
    extra?: Extra
  ): Promise<void>
  stop(extra?: Extra): Promise<void>
}
