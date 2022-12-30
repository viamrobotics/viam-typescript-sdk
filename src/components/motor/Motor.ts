import type { Extra } from '../../types'

export interface Properties {
  positionReporting: boolean
}

export interface Motor {
  setPower(power: number, extra?: Extra): Promise<void>
  goFor(rpm: number, revolutions: number, extra?: Extra): Promise<void>
  goTo(rpm: number, positionRevolutions: number, extra?: Extra): Promise<void>
  resetZeroPosition(offset: number, extra?: Extra): Promise<void>
  motorStop(extra?: Extra): Promise<void>
  getProperties(extra?: Extra): Promise<Properties>
  getPosition(extra?: Extra): Promise<number>
  isPowered(extra?: Extra): Promise<readonly [boolean, number]>
}
