// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardClient } from './client';
import { type Tick, type AnalogValue } from './board';
import { EventDispatcher } from '../../events';
import { type ResponseStream } from '../../gen/robot/v1/robot_pb_service';
import { RobotClient } from '../../robot';
vi.mock('../../robot');
import { StreamTicksResponse } from '../../gen/component/board/v1/board_pb';

import { BoardServiceClient } from '../../gen/component/board/v1/board_pb_service';
vi.mock('../../gen/component/board/v1/board_pb_service');

let board: BoardClient;
const testAnalogMin = 0;
const testAnalogMax = 5;
const testStepSize = 0.1;
const testValue = 2.2;

const testAnalogValue: AnalogValue = {
  value: testValue,
  min: testAnalogMin,
  max: testAnalogMax,
  stepSize: testStepSize,
};

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new BoardServiceClient('mysensor'));

  BoardServiceClient.prototype.readAnalogReader = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getValue: () => testValue,
        getMinRange: () => testAnalogMin,
        getMaxRange: () => testAnalogMax,
        getStepSize: () => testStepSize,
      });
    });

  board = new BoardClient(new RobotClient('host'), 'test-board');
});

afterEach(() => {
  vi.clearAllMocks();
});

it('get analog reading', async () => {
  await expect(board.readAnalogReader('test-reader')).resolves.toEqual(
    testAnalogValue,
  );
});

export class TestResponseStream<T> extends EventDispatcher {
  private stream: ResponseStream<any>;

  constructor(stream: ResponseStream<any>) {
    super();
    this.stream = stream;
  }

  override on(
    type: string,
    handler: (message: any) => void
  ): ResponseStream<T> {
    super.on(type, handler);
    return this;
  }

  cancel(): void {
    this.listeners = {};
    this.stream.cancel();
  }
}

let tickStream: ResponseStream<StreamTicksResponse>;
let testTickStream: TestResponseStream<StreamTicksResponse> | undefined;

const tickStreamMock = ():
  | TestResponseStream<StreamTicksResponse>
  | undefined => {
  return testTickStream;
};

beforeEach(() => {
  testTickStream = new TestResponseStream(tickStream);
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new BoardServiceClient('board'));

  BoardServiceClient.prototype.streamTicks = vi
    .fn()
    .mockImplementation(tickStreamMock);
  board = new BoardClient(new RobotClient('host'), 'test-board');
});

afterEach(() => {
  testTickStream = undefined;
});

describe('streamTicks tests', () => {
  it('streamTicks', () => {
    const ticks: Tick[] = [];
    board.streamTicks(['1', '2'], ticks);

    const response1 = new StreamTicksResponse();
    response1.setPinName('1');
    response1.setHigh(true);
    response1.setTime(1000);
    testTickStream?.emit('data', response1);

    const response2 = new StreamTicksResponse();
    response2.setPinName('2');
    response2.setHigh(false);
    response2.setTime(2000);
    testTickStream?.emit('data', response2);

    expect(ticks.length).toEqual(2);

    const tick1: Tick = ticks[0]!;
    expect(tick1.pinName).toEqual('1');
    expect(tick1.high).toBe(true);
    expect(tick1.time).toEqual(1000);

    const tick2: Tick = ticks[1]!;
    expect(tick2.pinName).toEqual('2');
    expect(tick2.high).toBe(false);
    expect(tick2.time).toEqual(2000);
  });

  it('end streamTicks with an error', () => {
    const error = { code: 1, details: 'test', metadata: undefined };

    const ticks: Tick[] = [];
    const promise1 = board.streamTicks(['1', '2'], ticks);

    testTickStream?.emit('end', undefined);
    expect(promise1).rejects.toStrictEqual({
      message: 'Stream ended without a status code',
    });

    const promise2 = board.streamTicks(['1', '2'], ticks);
    testTickStream?.emit('end', error);
    expect(promise2).rejects.toStrictEqual({
      code: 1,
      message: 'test',
      metadata: undefined,
    });

    const promise3 = board.streamTicks(['1', '2'], ticks);
    testTickStream?.emit('status', error);
    expect(promise3).rejects.toStrictEqual({
      code: 1,
      message: 'test',
      metadata: undefined,
    });
  });
});
