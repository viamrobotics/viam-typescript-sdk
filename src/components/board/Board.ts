import type { Extra } from '../../types'
import type { boardApi } from '../../main'

export interface Board{
    Status(extra?: Extra): Promise<boardApi.StatusResponse>;
    SetGPIO(pin: string, high: boolean, extra?: Extra): Promise<boardApi.SetGPIOResponse>;
    GetGPIO(pin: string, extra?: Extra): Promise<boardApi.GetGPIOResponse>;
    PWM(pin: string, extra?: Extra): Promise<boardApi.PWMResponse>;
    SetPWM(pin: string, dutyCyle: number, extra?: Extra): Promise<boardApi.SetPWMResponse>;
    PWMFrequency(pin: string, extra?: Extra): Promise<boardApi.PWMFrequencyResponse>;
    SetPWMFrequency(pin: string, frequencyHz: number, extra?: Extra): Promise<boardApi.SetPWMFrequencyResponse>;
    ReadAnalogReader(boardName: string, analogReader: string, extra?: Extra): Promise<boardApi.ReadAnalogReaderResponse>;
    GetDigitalInterruptValue
    (boardName: string, digitalInteruptName: string, extra?: Extra): Promise<boardApi.GetDigitalInterruptValueResponse>;
}
