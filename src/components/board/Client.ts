import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb'

import type { Board } from './Board'
import { BoardServiceClient } from '../../gen/component/board/v1/board_pb_service.esm'
import type Client from '../../Client'
import type { Options } from '../../types'

import { boardApi } from '../../main'
import { promisify } from '../../utils'


export class BoardClient implements Board {
  private client: BoardServiceClient
  private readonly name: string
  private readonly options: Options

  constructor (client: Client, name: string, options: Options = {}) {
    this.client = client.createServiceClient(BoardServiceClient)
    this.name = name
    this.options = options
  }

  private get boardService () {
    return this.client
  }
  async status (extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.StatusRequest()
    request.setName(this.name)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

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

    this.options.requestLogger?.(request)

    await promisify<boardApi.SetGPIORequest, boardApi.SetGPIOResponse>(
      boardService.setGPIO.bind(boardService),
      request
    )
  }
  async getGPIO (pin: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.GetGPIORequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    const response = await promisify<boardApi.GetGPIORequest, boardApi.GetGPIOResponse>(
      boardService.getGPIO.bind(boardService),
      request
    )
    return response.getHigh()
  }
  async getPWM (pin: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.PWMRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    const response = await promisify<boardApi.PWMRequest, boardApi.PWMResponse>(
      boardService.pWM.bind(boardService),
      request
    )
    return response.getDutyCyclePct()
  }
  async setPWM (pin: string, dutyCyle: number, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.SetPWMRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setDutyCyclePct(dutyCyle)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    await promisify<boardApi.SetPWMRequest, boardApi.SetPWMResponse>(
      boardService.setPWM.bind(boardService),
      request
    )
  }
  async getPWMFrequency (pin: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.PWMFrequencyRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    const response = await promisify<boardApi.PWMFrequencyRequest, boardApi.PWMFrequencyResponse>(
      boardService.pWMFrequency.bind(boardService),
      request
    )
    return response.getFrequencyHz()
  }
  async setPWMFrequency (pin: string, frequencyHz: number, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.SetPWMFrequencyRequest()
    request.setName(this.name)
    request.setPin(pin)
    request.setFrequencyHz(frequencyHz)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    await promisify<boardApi.SetPWMFrequencyRequest, boardApi.SetPWMFrequencyResponse>(
      boardService.setPWMFrequency.bind(boardService),
      request
    )
  }
  async readAnalogReader (boardName: string, analogReader: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.ReadAnalogReaderRequest()
    request.setBoardName(boardName)
    request.setAnalogReaderName(analogReader)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    const response = await promisify<boardApi.ReadAnalogReaderRequest, boardApi.ReadAnalogReaderResponse>(
      boardService.readAnalogReader.bind(boardService),
      request
    )
    return response.getValue()
  }
  async getDigitalInterruptValue (boardName: string, digitalInteruptName: string, extra = {}) {
    const boardService = this.boardService
    const request = new boardApi.GetDigitalInterruptValueRequest()
    request.setBoardName(boardName)
    request.setDigitalInterruptName(digitalInteruptName)
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra))

    this.options.requestLogger?.(request)

    const response = await promisify<boardApi.GetDigitalInterruptValueRequest, boardApi.GetDigitalInterruptValueResponse>(
      boardService.getDigitalInterruptValue.bind(boardService),
      request
    )
    return response.getValue()
  }
}
