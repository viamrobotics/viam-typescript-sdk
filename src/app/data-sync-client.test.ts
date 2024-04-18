import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DataCaptureUploadRequest,
  DataCaptureUploadResponse,
} from '../gen/app/datasync/v1/data_sync_pb';
import { DataSyncServiceClient } from '../gen/app/datasync/v1/data_sync_pb_service';
vi.mock('../gen/app/datasync/v1/data_sync_pb_service');
import { DataSyncClient } from './data-sync-client';

const testSensorData = { binary: new Uint8Array([1, 2]) };

const subject = () =>
  new DataSyncClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('DataSyncClient tests', () => {
  describe('dataCaptureUpload tests', () => {
    beforeEach(() => {
      vi.spyOn(DataSyncServiceClient.prototype, 'dataCaptureUpload')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req: DataCaptureUploadRequest, _md, cb) => {
          const response = new DataCaptureUploadResponse();
          response.setFileId('fileId');
          cb(null, response);
        });
    });

    it('upload data capture', async () => {
      const response = await subject().dataCaptureUpload([testSensorData]);
      expect(response).toStrictEqual('fileId');
    });
  });
});
