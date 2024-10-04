// @vitest-environment happy-dom

import {
  createPromiseClient,
  createRouterTransport,
} from '@connectrpc/connect';
import { createWritableIterable } from '@connectrpc/connect/protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SLAMService } from '../../gen/service/slam/v1/slam_connect';
import {
  GetInternalStateResponse,
  GetPointCloudMapRequest,
  GetPointCloudMapResponse,
} from '../../gen/service/slam/v1/slam_pb';
import { RobotClient } from '../../robot';
import { SlamClient } from './client';
vi.mock('../../gen/service/slam/v1/slam_pb_service');
vi.mock('../../robot');

let slam: SlamClient;

let testPcdStream = createWritableIterable<GetPointCloudMapResponse>();
let testPcdStreamEdited = createWritableIterable<GetPointCloudMapResponse>();
let testInternalStream = createWritableIterable<GetInternalStateResponse>();

const pointCloudMapMockfn = (
  requestMessage: GetPointCloudMapRequest
): AsyncIterable<GetPointCloudMapResponse> => {
  if (requestMessage.returnEditedMap) {
    return testPcdStreamEdited;
  }
  return testPcdStream;
};

describe('SlamClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(SLAMService, {
        getPointCloudMap: pointCloudMapMockfn,
        getInternalState: () => testInternalStream,
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createPromiseClient(SLAMService, mockTransport)
      );

    slam = new SlamClient(new RobotClient('host'), 'test-slam');
  });

  afterEach(() => {
    testPcdStream = createWritableIterable<GetPointCloudMapResponse>();
    testPcdStreamEdited = createWritableIterable<GetPointCloudMapResponse>();
    testInternalStream = createWritableIterable<GetInternalStateResponse>();
  });

  describe('getPointCloudMap tests', () => {
    it('get point cloud map', async () => {
      const promise = slam.getPointCloudMap();

      const chunk1 = new Uint8Array([4, 13]);
      await testPcdStream.write(
        new GetPointCloudMapResponse({
          pointCloudPcdChunk: chunk1,
        })
      );

      const chunk2 = new Uint8Array([16, 25]);
      await testPcdStream.write(
        new GetPointCloudMapResponse({
          pointCloudPcdChunk: chunk2,
        })
      );
      testPcdStream.close();

      const array = new Uint8Array([4, 13, 16, 25]);
      await expect(promise).resolves.toStrictEqual(array);

      // test map edit bool
      const promiseEdit = slam.getPointCloudMap(true);
      const chunk3Edited = new Uint8Array([5, 38]);
      await testPcdStreamEdited.write(
        new GetPointCloudMapResponse({
          pointCloudPcdChunk: chunk3Edited,
        })
      );
      testPcdStreamEdited.close();

      const arrayEdit = new Uint8Array([5, 38]);
      await expect(promiseEdit).resolves.toStrictEqual(arrayEdit);
    });
  });

  describe('getInternalState tests', () => {
    it('get internal state', async () => {
      const promise = slam.getInternalState();

      const chunk1 = new Uint8Array([4, 13]);
      await testInternalStream.write(
        new GetInternalStateResponse({
          internalStateChunk: chunk1,
        })
      );

      const chunk2 = new Uint8Array([16, 25]);
      await testInternalStream.write(
        new GetInternalStateResponse({
          internalStateChunk: chunk2,
        })
      );
      testInternalStream.close();

      const array = new Uint8Array([4, 13, 16, 25]);
      await expect(promise).resolves.toStrictEqual(array);
    });
  });
});
