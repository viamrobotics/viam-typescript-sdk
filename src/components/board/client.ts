import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

import { Duration as PBDuration } from 'google-protobuf/google/protobuf/duration_pb';
import { BoardServiceClient } from '../../gen/component/board/v1/board_pb_service';
import type { RobotClient } from '../../robot';
import type { Options, StructType } from '../../types';

import pb from '../../gen/component/board/v1/board_pb';
import { promisify, doCommandFromClient } from '../../utils';
import type { AnalogValue, Board, Duration, PowerMode, Tick } from './board';

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
      const value: AnalogValue = {
      value: response.getValue(),
      minRange: response.getMinRange(),
      maxRange: response.getMaxRange(),
      stepSize: response.getStepSize(),
    };
    return value;
  }

  async writeAnalog(pin: string, value: number, extra = {}) {
    const { boardService } = this;
    const request = new pb.WriteAnalogRequest();
    request.setName(this.name);
    request.setPin(pin);
    request.setValue(value);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.WriteAnalogRequest, pb.WriteAnalogResponse>(
      boardService.writeAnalog.bind(boardService),
      request
    );
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

  async streamTicks(interrupts: string[], queue: Tick[], extra = {}) {
    const request = new pb.StreamTicksRequest();
    request.setName(this.name);
    request.setPinNamesList(interrupts);
    request.setExtra(Struct.fromJavaScript(extra));
    this.options.requestLogger?.(request);
    const stream = this.client.streamTicks(request);
    stream.on('data', (response) => {
      const tick: Tick = {
        pinName: response.getPinName(),
        high: response.getHigh(),
        time: response.getTime(),
      };
      queue.push(tick);
    });

    return new Promise<void>((resolve, reject) => {
      stream.on('status', (status) => {
        if (status.code !== 0) {
          const error = {
            message: status.details,
            code: status.code,
            metadata: status.metadata,
          };
          reject(error);
        }
      });
      stream.on('end', (end) => {
        if (end === undefined) {
          const error = { message: 'Stream ended without a status code' };
          reject(error);
        } else if (end.code !== 0) {
          const error = {
            message: end.details,
            code: end.code,
            metadata: end.metadata,
          };
          reject(error);
        }
        resolve();
      });
    });
  }

  async setPowerMode(
    name: string,
    powerMode: PowerMode,
    duration?: Duration,
    extra = {}
  ) {
    const { boardService } = this;
    const request = new pb.SetPowerModeRequest();
    request.setName(name);
    request.setPowerMode(powerMode);
    if (duration) {
      const pbDuration = new PBDuration();
      pbDuration.setNanos(duration.nanos);
      pbDuration.setSeconds(duration.seconds);
      request.setDuration(pbDuration);
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetPowerModeRequest, pb.SetPowerModeResponse>(
      boardService.setPowerMode.bind(boardService),
      request
    );
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { boardService } = this;
    return doCommandFromClient(boardService, this.name, command, this.options);
  }
}
