// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamTicksResponse } from '../../gen/component/board/v1/board_pb';
import { RobotClient } from '../../robot';
import { AnalogValue, type Tick } from './board';
import { BoardClient } from './client';
vi.mock('../../robot');

import type { PartialMessage } from '@bufbuild/protobuf';
import {
  createPromiseClient,
  createRouterTransport,
} from '@connectrpc/connect';
import {
  createWritableIterable,
  type WritableIterable,
} from '@connectrpc/connect/protocol';
import { BoardService } from '../../gen/component/board/v1/board_connect';
vi.mock('../../gen/component/board/v1/board_pb_service');

let board: BoardClient;
const testAnalogMin = 0;
const testAnalogMax = 5;
const testStepSize = 0.5;
const testValue = 2;

const testAnalogValue: AnalogValue = new AnalogValue({
  value: testValue,
  minRange: testAnalogMin,
  maxRange: testAnalogMax,
  stepSize: testStepSize,
});

let testTickStream: WritableIterable<PartialMessage<StreamTicksResponse>>;

describe('BoardClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(BoardService, {
        readAnalogReader: () => {
          return testAnalogValue;
        },
        streamTicks: () => {
          return testTickStream;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createPromiseClient(BoardService, mockTransport)
      );

    board = new BoardClient(new RobotClient('host'), 'test-board');
  });

  afterEach(() => {
    vi.clearAllMocks();
    testTickStream =
      createWritableIterable<PartialMessage<StreamTicksResponse>>();
  });

  it('get analog reading', async () => {
    await expect(board.readAnalogReader('test-reader')).resolves.toEqual(
      testAnalogValue
    );
  });

  describe('streamTicks tests', () => {
    it('streamTicks', async () => {
      const ticks: Tick[] = [];
      const streamProm = board.streamTicks(['1', '2'], ticks);

      await testTickStream.write({
        pinName: '1',
        high: true,
        time: BigInt(1000),
      });

      await testTickStream.write({
        pinName: '2',
        high: false,
        time: BigInt(2000),
      });

      testTickStream.close();
      await streamProm;

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
  });
});
