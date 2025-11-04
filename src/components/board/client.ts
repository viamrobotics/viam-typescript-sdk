import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { Duration, Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { BoardService } from '../../gen/component/board/v1/board_connect';
import {
  GetDigitalInterruptValueRequest,
  GetGPIORequest,
  PWMFrequencyRequest,
  PWMRequest,
  ReadAnalogReaderRequest,
  SetGPIORequest,
  SetPWMFrequencyRequest,
  SetPWMRequest,
  SetPowerModeRequest,
  StreamTicksRequest,
  WriteAnalogRequest,
} from '../../gen/component/board/v1/board_pb';
import { doCommandFromClient } from '../../utils';
import { type Board, type PowerMode, type Tick } from './board';

/**
 * A gRPC-web client for the Board component.
 *
 * @group Clients
 */
export class BoardClient implements Board {
  private client: Client<typeof BoardService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(BoardService);
    this.name = name;
    this.options = options;
  }

  async setGPIO(
    pin: string,
    high: boolean,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetGPIORequest({
      name: this.name,
      pin,
      high,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setGPIO(request, callOptions);
  }

  async getGPIO(pin: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetGPIORequest({
      name: this.name,
      pin,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getGPIO(request, callOptions);
    return resp.high;
  }

  async getPWM(pin: string, extra = {}, callOptions = this.callOptions) {
    const request = new PWMRequest({
      name: this.name,
      pin,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.pWM(request, callOptions);
    return resp.dutyCyclePct;
  }

  async setPWM(
    pin: string,
    dutyCyle: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetPWMRequest({
      name: this.name,
      pin,
      dutyCyclePct: dutyCyle,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPWM(request, callOptions);
  }

  async getPWMFrequency(
    pin: string,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new PWMFrequencyRequest({
      name: this.name,
      pin,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.pWMFrequency(request, callOptions);
    return Number(resp.frequencyHz);
  }

  async setPWMFrequency(
    pin: string,
    frequencyHz: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetPWMFrequencyRequest({
      name: this.name,
      pin,
      frequencyHz: frequencyHz ? BigInt(frequencyHz) : undefined,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPWMFrequency(request, callOptions);
  }

  async readAnalogReader(
    analogReader: string,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new ReadAnalogReaderRequest({
      boardName: this.name,
      analogReaderName: analogReader,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.readAnalogReader(request, callOptions);
  }

  async writeAnalog(
    pin: string,
    value: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new WriteAnalogRequest({
      name: this.name,
      pin,
      value,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.writeAnalog(request, callOptions);
  }

  async getDigitalInterruptValue(
    digitalInterruptName: string,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GetDigitalInterruptValueRequest({
      boardName: this.name,
      digitalInterruptName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getDigitalInterruptValue(
      request,
      callOptions
    );
    return Number(resp.value);
  }

  async streamTicks(
    interrupts: string[],
    queue: Tick[],
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new StreamTicksRequest({
      name: this.name,
      pinNames: interrupts,
      extra: Struct.fromJson(extra),
    });
    this.options.requestLogger?.(request);
    const stream = this.client.streamTicks(request, callOptions);

    for await (const latest of stream) {
      queue.push({
        pinName: latest.pinName,
        high: latest.high,
        time: latest.time ? Number(latest.time) : 0,
      });
    }
  }

  async setPowerMode(
    powerMode: PowerMode,
    duration?: Duration,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetPowerModeRequest({
      name: this.name,
      powerMode,
      duration,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPowerMode(request, callOptions);
  }

  async doCommand(
    command: Struct,
    callOptions = this.callOptions
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}
