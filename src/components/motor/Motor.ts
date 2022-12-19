import type { Extra } from '../../types'
import type { motorApi } from '../../main'

export interface Properties {
  positionReporting: boolean
}

export interface Motor {
  setPower(power: number, extra?: Extra): Promise<motorApi.SetPowerResponse>;
  goFor(rpm: number, revolutions: number, extra?: Extra): Promise<motorApi.GoForResponse>;
  goTo(rpm: number, positionRevolutions: number, extra?: Extra): Promise<motorApi.GoToResponse>;
  resetZeroPosition(offset: number, extra?: Extra): Promise<motorApi.ResetZeroPositionResponse>;
  motorStop(extra?: Extra): Promise<motorApi.StopResponse>;
  getProperties(extra?: Extra): Promise<Properties>;
  getPosition(extra?: Extra): Promise<number>;
  isPowered(extra?: Extra): Promise<readonly [boolean, number]>;
}
