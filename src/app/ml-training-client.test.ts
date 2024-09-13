import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CancelTrainingJobRequest,
  DeleteCompletedTrainingJobRequest,
  GetTrainingJobRequest,
  GetTrainingJobResponse,
  ListTrainingJobsRequest,
  ListTrainingJobsResponse,
  ModelType,
  SubmitTrainingJobRequest,
  SubmitTrainingJobResponse,
  SubmitCustomTrainingJobRequest,
  SubmitCustomTrainingJobResponse,
  TrainingJobMetadata,
  TrainingStatus,
} from '../gen/app/mltraining/v1/ml_training_pb';
import { MLTrainingServiceClient } from '../gen/app/mltraining/v1/ml_training_pb_service';
vi.mock('../gen/app/mltraining/v1/ml_training_pb_service');
import { MlTrainingClient } from './ml-training-client';

const subject = () =>
  new MlTrainingClient('fakeServiceHoost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('MlTrainingClient tests', () => {
  describe('submitTrainingJob tests', () => {
    const type = ModelType.MODEL_TYPE_UNSPECIFIED;
    beforeEach(() => {
      vi.spyOn(MLTrainingServiceClient.prototype, 'submitTrainingJob')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: SubmitTrainingJobRequest, _md, cb) => {
          const response = new SubmitTrainingJobResponse();
          response.setId('fakeId');
          cb(null, response);
        });
    });

    it('submit job training job', async () => {
      const response = await subject().submitTrainingJob(
        'org_id',
        'dataset_id',
        'model_name',
        'model_version',
        type,
        ['tag1']
      );
      expect(response).toEqual('fakeId');
    });
  });

  describe('submitCustomTrainingJob tests', () => {
    beforeEach(() => {
      vi.spyOn(
        MLTrainingServiceClient.prototype,
        'submitCustomTrainingJob'
      ).mockImplementationOnce(
        // @ts-expect-error compiler is matching incorrect function signature
        (_req: SubmitCustomTrainingJobRequest, _md, cb) => {
          const response = new SubmitCustomTrainingJobResponse();
          response.setId('fakeId');
          cb(null, response);
        }
      );
    });

    it('submit custom training job', async () => {
      const response = await subject().submitCustomTrainingJob(
        'org_id',
        'dataset_id',
        'registry_item_id',
        'registry_item_version',
        'model_name',
        'model_version'
      );
      expect(response).toEqual('fakeId');
    });
  });

  describe('getTrainingJob tests', () => {
    const metadata: TrainingJobMetadata = new TrainingJobMetadata();
    metadata.setId('id');
    metadata.setDatasetId('dataset_id');
    metadata.setOrganizationId('org_id');
    metadata.setModelVersion('model_version');
    metadata.setModelType(ModelType.MODEL_TYPE_UNSPECIFIED);
    metadata.setStatus(TrainingStatus.TRAINING_STATUS_UNSPECIFIED);
    metadata.setSyncedModelId('synced_model_id');

    beforeEach(() => {
      vi.spyOn(MLTrainingServiceClient.prototype, 'getTrainingJob')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: GetTrainingJobRequest, _md, cb) => {
          const response = new GetTrainingJobResponse();
          response.setMetadata(metadata);
          cb(null, response);
        });
    });

    it('get training job', async () => {
      const response = await subject().getTrainingJob('id');
      expect(response).toEqual(metadata);
    });
  });

  describe('listTrainingJobs', () => {
    const status = TrainingStatus.TRAINING_STATUS_UNSPECIFIED;
    const md1 = new TrainingJobMetadata();
    md1.setId('id1');
    md1.setDatasetId('dataset_id1');
    md1.setOrganizationId('org_id1');
    md1.setModelVersion('model_version1');
    md1.setModelType(ModelType.MODEL_TYPE_UNSPECIFIED);
    md1.setStatus(TrainingStatus.TRAINING_STATUS_UNSPECIFIED);
    md1.setSyncedModelId('synced_model_id1');
    const md2 = new TrainingJobMetadata();
    md1.setId('id2');
    md1.setDatasetId('dataset_id2');
    md1.setOrganizationId('org_id2');
    md1.setModelVersion('model_version2');
    md1.setModelType(ModelType.MODEL_TYPE_UNSPECIFIED);
    md1.setStatus(TrainingStatus.TRAINING_STATUS_UNSPECIFIED);
    md1.setSyncedModelId('synced_model_id2');
    const jobs = [md1, md2];

    beforeEach(() => {
      vi.spyOn(MLTrainingServiceClient.prototype, 'listTrainingJobs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: ListTrainingJobsRequest, _md, cb) => {
          const response = new ListTrainingJobsResponse();
          response.setJobsList(jobs);
          cb(null, response);
        });
    });

    it('list training jobs', async () => {
      const response = await subject().listTrainingJobs('org_id', status);
      expect(response).toEqual([md1.toObject(), md2.toObject()]);
    });
  });

  describe('cancelTrainingJob tests', () => {
    const id = 'id';
    beforeEach(() => {
      vi.spyOn(MLTrainingServiceClient.prototype, 'cancelTrainingJob')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((req: CancelTrainingJobRequest, _md, cb) => {
          expect(req.getId()).toStrictEqual(id);
          cb(null, {});
        });
    });
    it('cancel training job', async () => {
      expect(await subject().cancelTrainingJob(id)).toStrictEqual(null);
    });
  });

  describe('deleteCompletedTrainingJob tests', () => {
    const id = 'id';
    beforeEach(() => {
      vi.spyOn(
        MLTrainingServiceClient.prototype,
        'deleteCompletedTrainingJob'
      ).mockImplementationOnce(
        // @ts-expect-error compiler is matching incorrect function signature
        (req: DeleteCompletedTrainingJobRequest, _md, cb) => {
          expect(req.getId()).toStrictEqual(id);
          cb(null, {});
        }
      );
    });
    it('delete completed training job', async () => {
      expect(await subject().deleteCompletedTrainingJob(id)).toEqual(null);
    });
  });
});
