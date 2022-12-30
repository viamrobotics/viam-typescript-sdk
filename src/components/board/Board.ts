import type { Extra } from '../../types'
import type { boardApi } from '../../main'

export interface Board {
  status(extra?: Extra): Promise<boardApi.StatusResponse>
  setGPIO(pin: string, high: boolean, extra?: Extra): Promise<void>
  getGPIO(pin: string, extra?: Extra): Promise<boolean>
  getPWM(pin: string, extra?: Extra): Promise<number>
  setPWM(pin: string, dutyCyle: number, extra?: Extra): Promise<void>
  getPWMFrequency(pin: string, extra?: Extra): Promise<number>
  setPWMFrequency(
    pin: string,
    frequencyHz: number,
    extra?: Extra
  ): Promise<void>
  readAnalogReader(
    boardName: string,
    analogReader: string,
    extra?: Extra
  ): Promise<number>
  getDigitalInterruptValue(
    boardName: string,
    digitalInteruptName: string,
    extra?: Extra
  ): Promise<number>
}
