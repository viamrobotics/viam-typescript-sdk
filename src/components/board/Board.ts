import type { Extra } from '../../types'
import type { boardApi } from '../../main'

export interface Board{
    status(extra?: Extra): Promise<boardApi.StatusResponse>;
    setGPIO(pin: string, high: boolean, extra?: Extra): Promise<boardApi.SetGPIOResponse>;
    getGPIO(pin: string, extra?: Extra): Promise<boardApi.GetGPIOResponse>;
    pWM(pin: string, extra?: Extra): Promise<boardApi.PWMResponse>;
    setPWM(pin: string, dutyCyle: number, extra?: Extra): Promise<boardApi.SetPWMResponse>;
    pWMFrequency(pin: string, extra?: Extra): Promise<boardApi.PWMFrequencyResponse>;
    setPWMFrequency(pin: string, frequencyHz: number, extra?: Extra): Promise<boardApi.SetPWMFrequencyResponse>;
    readAnalogReader(boardName: string, analogReader: string, extra?: Extra): Promise<boardApi.ReadAnalogReaderResponse>;
    getDigitalInterruptValue
    (boardName: string, digitalInteruptName: string, extra?: Extra): Promise<boardApi.GetDigitalInterruptValueResponse>;
}
