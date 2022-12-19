/* eslint-disable @typescript-eslint/no-explicit-any */
import type { motorApi } from '../../main'

export interface Properties {
  positionReporting: boolean
}

export interface Motor {
  setPower(power: number, extra?:Map<string, any>):Promise<motorApi.SetPowerResponse>;
  goFor(rpm:number, revolutions:number, extra?:Map<string, any>):Promise<motorApi.GoForResponse>;
  goTo(rpm:number, positionRevolutions:number, extra?:Map<string, any>):Promise<motorApi.GoToResponse>;
  resetZeroPosition(offset:number, extra?:Map<string, any>):Promise<motorApi.ResetZeroPositionResponse>;
  motorStop(extra?:Map<string, any>) :Promise<motorApi.StopResponse>;
  getProperties(extra?:Map<string, any>) :Promise<Properties>;
  getPosition(extra?:Map<string, any>):Promise<number>;
  isPowered(extra?:Map<string, any>):Promise<readonly [boolean, number]>;
}
