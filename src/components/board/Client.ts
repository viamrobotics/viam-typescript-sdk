import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb'

import type { Board } from './Board'
import { BoardServiceClient } from '../../gen/component/board/v1/board_pb_service.esm'
import type Client from '../../Client'

import { boardApi } from '../../main'
import { promisify } from '../../utils'


export class BoardClient implements Board {
  private client: BoardServiceClient
  private name: string

  constructor (client: Client, name: string) {
    this.client = client.createServiceClient(BoardServiceClient)
    this.name = name
  }

  private get boardService () {
    return this.client
  }
  async status (extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.StatusRequest()
    request.setName(this.name)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.StatusRequest, boardApi.StatusResponse>(
      boardService.status.bind(boardService),
      request
    )
    return response
  }
  async setGPIO (pin: string, high: boolean, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.SetGPIORequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setHigh(high)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.SetGPIORequest, boardApi.SetGPIOResponse>(
      boardService.setGPIO.bind(boardService),
      request
    )
    return response
  }
  async getGPIO (pin: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.GetGPIORequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.GetGPIORequest, boardApi.GetGPIOResponse>(
      boardService.getGPIO.bind(boardService),
      request
    )
    return response
  }
  async pWM (pin: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.PWMRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.PWMRequest, boardApi.PWMResponse>(
      boardService.pWM.bind(boardService),
      request
    )
    return response
  }
  async setPWM (pin: string, dutyCyle: number, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.SetPWMRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setDutyCyclePct(dutyCyle)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.SetPWMRequest, boardApi.SetPWMResponse>(
      boardService.setPWM.bind(boardService),
      request
    )
    return response
  }
  async pWMFrequency (pin: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.PWMFrequencyRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.PWMFrequencyRequest, boardApi.PWMFrequencyResponse>(
      boardService.pWMFrequency.bind(boardService),
      request
    )
    return response
  }
  async setPWMFrequency (pin: string, frequencyHz: number, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.SetPWMFrequencyRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setFrequencyHz(frequencyHz)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.SetPWMFrequencyRequest, boardApi.SetPWMFrequencyResponse>(
      boardService.setPWMFrequency.bind(boardService),
      request
    )
    return response
  }
  async readAnalogReader (boardName: string, analogReader: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.ReadAnalogReaderRequest()
    request.setBoardName(boardName)
    request.setAnalogReaderName(analogReader)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.ReadAnalogReaderRequest, boardApi.ReadAnalogReaderResponse>(
      boardService.readAnalogReader.bind(boardService),
      request
    )
    return response
  }
  async getDigitalInterruptValue (boardName: string, digitalInteruptName: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.GetDigitalInterruptValueRequest()
    request.setBoardName(boardName)
    request.setDigitalInterruptName(digitalInteruptName)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))
    const response = await promisify<boardApi.GetDigitalInterruptValueRequest, boardApi.GetDigitalInterruptValueResponse>(
      boardService.getDigitalInterruptValue.bind(boardService),
      request
    )
    return response
  }
}
