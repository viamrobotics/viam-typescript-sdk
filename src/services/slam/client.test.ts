// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SLAMServiceClient } from '../../gen/service/slam/v1/slam_pb_service';
vi.mock('../../gen/service/slam/v1/slam_pb_service');
import { type ResponseStream } from '../../gen/robot/v1/robot_pb_service';
import { RobotClient } from '../../robot';
vi.mock('../../robot');
import { EventDispatcher } from '../../events';
import {
  GetInternalStateResponse,
  GetPointCloudMapRequest,
  GetPointCloudMapResponse,
} from '../../gen/service/slam/v1/slam_pb';
import { SlamClient } from './client';

let slam: SlamClient;

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

let pcdStream: ResponseStream<GetPointCloudMapResponse>;
let testPcdStream: TestResponseStream<GetPointCloudMapResponse> | undefined;
let testPcdStreamEdited:
  | TestResponseStream<GetPointCloudMapResponse>
  | undefined;
let internalStream: ResponseStream<GetInternalStateResponse>;
let testInternalStream:
  | TestResponseStream<GetInternalStateResponse>
  | undefined;

const pointCloudMapMockfn = (
  requestMessage: GetPointCloudMapRequest
): TestResponseStream<GetPointCloudMapResponse> | undefined => {
  if (requestMessage.getReturnEditedMap()) {
    return testPcdStreamEdited;
  }
  return testPcdStream;
};

beforeEach(() => {
  testPcdStream = new TestResponseStream(pcdStream);
  testPcdStreamEdited = new TestResponseStream(pcdStream);
  testInternalStream = new TestResponseStream(internalStream);
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new SLAMServiceClient('myslam'));

  SLAMServiceClient.prototype.getPointCloudMap = vi
    .fn()
    .mockImplementation(pointCloudMapMockfn);
  SLAMServiceClient.prototype.getInternalState = vi
    .fn()
    .mockImplementation(() => testInternalStream);

  slam = new SlamClient(new RobotClient('host'), 'test-slam');
});

afterEach(() => {
  testPcdStream = undefined;
  testInternalStream = undefined;
});

describe('getPointCloudMap tests', () => {
  it('get point cloud map', () => {
    const promise = slam.getPointCloudMap();

    const response1 = new GetPointCloudMapResponse();
    const chunk1 = new Uint8Array([4, 13]);
    response1.setPointCloudPcdChunk(chunk1);
    testPcdStream?.emit('data', response1);

    const response2 = new GetPointCloudMapResponse();
    const chunk2 = new Uint8Array([16, 25]);
    response2.setPointCloudPcdChunk(chunk2);
    testPcdStream?.emit('data', response2);
    testPcdStream?.emit('end', { code: 0 });

    const array = new Uint8Array([4, 13, 16, 25]);
    expect(promise).resolves.toStrictEqual(array);

    // test map edit bool
    const promiseEdit = slam.getPointCloudMap(true);
    // unused chunk
    const response3 = new GetPointCloudMapResponse();
    const chunk3 = new Uint8Array([4, 27]);
    response3.setPointCloudPcdChunk(chunk3);
    testPcdStream?.emit('data', response3);
    testPcdStream?.emit('end', { code: 0 });
    // used chunk
    const response3Edited = new GetPointCloudMapResponse();
    const chunk3Edited = new Uint8Array([5, 38]);
    response3Edited.setPointCloudPcdChunk(chunk3Edited);
    testPcdStreamEdited?.emit('data', response3Edited);
    testPcdStreamEdited?.emit('end', { code: 0 });

    const arrayEdit = new Uint8Array([5, 38]);
    expect(promiseEdit).resolves.toStrictEqual(arrayEdit);
  });

  it('end getPcdMap stream with wrong code', () => {
    const error = { code: 1, details: 'fake', metadata: undefined };

    const promise1 = slam.getPointCloudMap();
    // @ts-expect-error We need to pass "undefined" as a second argument here, but it gets removed by the linter since omitting an argument is equivalent to passing in "undefined"
    testPcdStream?.emit('end');
    expect(promise1).rejects.toStrictEqual({
      message: 'Stream ended without a status code',
    });

    const promise2 = slam.getPointCloudMap();
    testPcdStream?.emit('end', error);
    expect(promise2).rejects.toStrictEqual({
      code: 1,
      message: 'fake',
      metadata: undefined,
    });

    const promise3 = slam.getPointCloudMap();
    testPcdStream?.emit('status', error);
    expect(promise3).rejects.toStrictEqual({
      code: 1,
      message: 'fake',
      metadata: undefined,
    });
  });
});

describe('getInternalState tests', () => {
  it('get internal state', () => {
    const promise = slam.getInternalState();

    const response1 = new GetInternalStateResponse();
    const chunk1 = new Uint8Array([4, 13]);
    response1.setInternalStateChunk(chunk1);
    testInternalStream?.emit('data', response1);

    const response2 = new GetInternalStateResponse();
    const chunk2 = new Uint8Array([16, 25]);
    response2.setInternalStateChunk(chunk2);
    testInternalStream?.emit('data', response2);
    testInternalStream?.emit('end', { code: 0 });

    const array = new Uint8Array([4, 13, 16, 25]);
    expect(promise).resolves.toStrictEqual(array);
  });

  it('end getInternalState stream with wrong code', () => {
    const error = { code: 1, details: 'fake', metadata: undefined };

    const promise1 = slam.getInternalState();
    // @ts-expect-error We need to pass "undefined" as a second argument here, but it gets removed by the linter since omitting an argument is equivalent to passing in "undefined"
    testInternalStream?.emit('end');
    expect(promise1).rejects.toStrictEqual({
      message: 'Stream ended without a status code',
    });

    const promise2 = slam.getInternalState();
    testInternalStream?.emit('end', error);
    expect(promise2).rejects.toStrictEqual({
      code: 1,
      message: 'fake',
      metadata: undefined,
    });

    const promise3 = slam.getInternalState();
    testInternalStream?.emit('status', error);
    expect(promise3).rejects.toStrictEqual({
      code: 1,
      message: 'fake',
      metadata: undefined,
    });
  });
});
