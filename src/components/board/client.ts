import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

import { BoardServiceClient } from '../../gen/component/board/v1/board_pb_service';
import type { RobotClient } from '../../robot';
import type { Options, StructType } from '../../types';

import pb from '../../gen/component/board/v1/board_pb';
import { promisify, doCommandFromClient } from '../../utils';
import type { Board } from './board';

/**
 * A gRPC-web client for the Board component.
 *
 * @group Clients
 */
export class BoardClient implements Board {
  private client: BoardServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(BoardServiceClient);
    this.name = name;
    this.options = options;
  }

  private get boardService() {
    return this.client;
  }

  private async getRawStatusResponse(extra = {}): Promise<pb.StatusResponse> {
    const { boardService } = this;
    const request = new pb.StatusRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    return promisify<pb.StatusRequest, pb.StatusResponse>(
      boardService.status.bind(boardService),
      request
    );
  }

  /**
   * Get the status of the board as a raw protobuf response.
   *
   * @deprecated Use {@link BoardClient#getStatus} instead.
   */
  public status(extra = {}): Promise<pb.StatusResponse> {
    return this.getRawStatusResponse(extra);
  }

  async getStatus(extra = {}) {
    const response = await this.getRawStatusResponse(extra);
    const boardStatus = response.getStatus();

    if (!boardStatus) {
      throw new Error('no status');
    }

    const analogs: Record<string, number> = {};
    for (const [key, value] of boardStatus.getAnalogsMap().entries()) {
      analogs[key] = value.getValue();
    }

    const digitalInterrupts: Record<string, number> = {};
    for (const [key, value] of boardStatus
      .getDigitalInterruptsMap()
      .entries()) {
      digitalInterrupts[key] = value.getValue();
    }

    return { analogs, digitalInterrupts };
  }

  async setGPIO(pin: string, high: boolean, extra = {}) {
    const { boardService } = this;
    const request = new pb.SetGPIORequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setHigh(high);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetGPIORequest, pb.SetGPIOResponse>(
      boardService.setGPIO.bind(boardService),
      request
    );
  }

  async getGPIO(pin: string, extra = {}) {
    const { boardService } = this;
    const request = new pb.GetGPIORequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.GetGPIORequest, pb.GetGPIOResponse>(
      boardService.getGPIO.bind(boardService),
      request
    );
    return response.getHigh();
  }

  async getPWM(pin: string, extra = {}) {
    const { boardService } = this;
    const request = new pb.PWMRequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.PWMRequest, pb.PWMResponse>(
      boardService.pWM.bind(boardService),
      request
    );
    return response.getDutyCyclePct();
  }

  async setPWM(pin: string, dutyCyle: number, extra = {}) {
    const { boardService } = this;
    const request = new pb.SetPWMRequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setDutyCyclePct(dutyCyle);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetPWMRequest, pb.SetPWMResponse>(
      boardService.setPWM.bind(boardService),
      request
    );
  }

  async getPWMFrequency(pin: string, extra = {}) {
    const { boardService } = this;
    const request = new pb.PWMFrequencyRequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.PWMFrequencyRequest,
      pb.PWMFrequencyResponse
    >(boardService.pWMFrequency.bind(boardService), request);
    return response.getFrequencyHz();
  }

  async setPWMFrequency(pin: string, frequencyHz: number, extra = {}) {
    const { boardService } = this;
    const request = new pb.SetPWMFrequencyRequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setFrequencyHz(frequencyHz);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetPWMFrequencyRequest, pb.SetPWMFrequencyResponse>(
      boardService.setPWMFrequency.bind(boardService),
      request
    );
  }

  async readAnalogReader(analogReader: string, extra = {}) {
    const { boardService } = this;
    const request = new pb.ReadAnalogReaderRequest();
    request.setBoardName(this.name);
    request.setAnalogReaderName(analogReader);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.ReadAnalogReaderRequest,
      pb.ReadAnalogReaderResponse
    >(boardService.readAnalogReader.bind(boardService), request);
    return response.getValue();
  }

  async getDigitalInterruptValue(digitalInteruptName: string, extra = {}) {
    const { boardService } = this;
    const request = new pb.GetDigitalInterruptValueRequest();
    request.setBoardName(this.name);
    request.setDigitalInterruptName(digitalInteruptName);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetDigitalInterruptValueRequest,
      pb.GetDigitalInterruptValueResponse
    >(boardService.getDigitalInterruptValue.bind(boardService), request);
    return response.getValue();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { boardService } = this;
    return doCommandFromClient(boardService, this.name, command, this.options);
  }
}
