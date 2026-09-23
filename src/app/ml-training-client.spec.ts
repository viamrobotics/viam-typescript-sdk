import { createRouterTransport, type Transport } from '@connectrpc/connect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MLTrainingService } from '../gen/app/mltraining/v1/ml_training_connect';
import {
  type CancelTrainingJobRequest,
  CancelTrainingJobResponse,
  Container,
  type DeleteCompletedTrainingJobRequest,
  DeleteCompletedTrainingJobResponse,
  type DeleteCustomTrainingContainerRequest,
  DeleteCustomTrainingContainerResponse,
  GetTrainingJobResponse,
  type ListContainersRequest,
  ListContainersResponse,
  ListTrainingJobsResponse,
  ModelType,
  type RegisterCustomTrainingContainerRequest,
  RegisterCustomTrainingContainerResponse,
  SubmitCustomTrainingJobResponse,
  SubmitTrainingJobResponse,
  TrainingJobMetadata,
  TrainingStatus,
} from '../gen/app/mltraining/v1/ml_training_pb';
import { MlTrainingClient } from './ml-training-client';
vi.mock('../gen/app/mltraining/v1/ml_training_pb_service');

let mockTransport: Transport;
const subject = () => new MlTrainingClient(mockTransport);

describe('MlTrainingClient tests', () => {
  describe('submitTrainingJob tests', () => {
    const type = ModelType.UNSPECIFIED;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          submitTrainingJob: () => {
            return new SubmitTrainingJobResponse({
              id: 'fakeId',
            });
          },
        });
      });
    });

    it('submit job training job', async () => {
      const response = await subject().submitTrainingJob(
        'org_id',
        'dataset_id',
        'model_name',
        'model_version',
        type,
        ['tag1'],
      );
      expect(response).toEqual('fakeId');
    });
  });

  describe('submitCustomTrainingJob tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          submitCustomTrainingJob: () => {
            return new SubmitCustomTrainingJobResponse({
              id: 'fakeId',
            });
          },
        });
      });
    });

    it('submit custom training job', async () => {
      const response = await subject().submitCustomTrainingJob(
        'org_id',
        'dataset_id',
        'registry_item_id',
        'registry_item_version',
        'model_name',
        'model_version',
      );
      expect(response).toEqual('fakeId');
    });
  });

  describe('getTrainingJob tests', () => {
    const metadata: TrainingJobMetadata = new TrainingJobMetadata({
      id: 'id',
      datasetId: 'dataset_id',
      organizationId: 'org_id',
      modelVersion: 'model_version',
      modelType: ModelType.UNSPECIFIED,
      status: TrainingStatus.UNSPECIFIED,
      syncedModelId: 'synced_model_id',
    });

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          getTrainingJob: () => {
            return new GetTrainingJobResponse({
              metadata,
            });
          },
        });
      });
    });

    it('get training job', async () => {
      const response = await subject().getTrainingJob('id');
      expect(response).toEqual(metadata);
    });
  });

  describe('listTrainingJobs', () => {
    const status = TrainingStatus.UNSPECIFIED;
    const md1 = new TrainingJobMetadata({
      id: 'id1',
      datasetId: 'dataset_id1',
      organizationId: 'org_id1',
      modelVersion: 'model_version1',
      modelType: ModelType.UNSPECIFIED,
      status: TrainingStatus.UNSPECIFIED,
      syncedModelId: 'synced_model_id1',
    });

    const md2 = new TrainingJobMetadata({
      id: 'id2',
      datasetId: 'dataset_id2',
      organizationId: 'org_id2',
      modelVersion: 'model_version2',
      modelType: ModelType.UNSPECIFIED,
      status: TrainingStatus.UNSPECIFIED,
      syncedModelId: 'synced_model_id2',
    });
    const jobs = [md1, md2];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          listTrainingJobs: () => {
            return new ListTrainingJobsResponse({
              jobs,
            });
          },
        });
      });
    });

    it('list training jobs', async () => {
      const response = await subject().listTrainingJobs('org_id', status);
      expect(response).toEqual([md1, md2]);
    });
  });

  describe('cancelTrainingJob tests', () => {
    const id = 'id';
    let capReq: CancelTrainingJobRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          cancelTrainingJob: (req) => {
            capReq = req;
            return new CancelTrainingJobResponse();
          },
        });
      });
    });
    it('cancel training job', async () => {
      expect(await subject().cancelTrainingJob(id)).toStrictEqual(null);
      expect(capReq.id).toStrictEqual(id);
    });
  });

  describe('deleteCompletedTrainingJob tests', () => {
    const id = 'id';
    let capReq: DeleteCompletedTrainingJobRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          deleteCompletedTrainingJob: (req) => {
            capReq = req;
            return new DeleteCompletedTrainingJobResponse();
          },
        });
      });
    });
    it('delete completed training job', async () => {
      expect(await subject().deleteCompletedTrainingJob(id)).toEqual(null);
      expect(capReq.id).toStrictEqual(id);
    });
  });

  describe('listContainers tests', () => {
    const containers = [
      new Container({ key: 'tf:2.15', uri: 'us-docker.pkg.dev/tf-gpu.2-15.py310:latest' }),
    ];
    let capReq: ListContainersRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          listContainers: (req) => {
            capReq = req;
            return new ListContainersResponse({ containers });
          },
        });
      });
    });

    it('list containers', async () => {
      const response = await subject().listContainers('org_id');
      expect(response).toEqual(containers);
      expect(capReq.organizationId).toStrictEqual('org_id');
    });
  });

  describe('registerCustomTrainingContainer tests', () => {
    let capReq: RegisterCustomTrainingContainerRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          registerCustomTrainingContainer: (req) => {
            capReq = req;
            return new RegisterCustomTrainingContainerResponse({ id: 'fakeId' });
          },
        });
      });
    });

    it('registers a custom training container', async () => {
      const response = await subject().registerCustomTrainingContainer(
        'org_id',
        'image_uri',
        'description',
      );
      expect(response).toStrictEqual('fakeId');
      expect(capReq.organizationId).toStrictEqual('org_id');
      expect(capReq.imageUri).toStrictEqual('image_uri');
      expect(capReq.description).toStrictEqual('description');
    });
  });

  describe('deleteCustomTrainingContainer tests', () => {
    const id = 'id';
    let capReq: DeleteCustomTrainingContainerRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(MLTrainingService, {
          deleteCustomTrainingContainer: (req) => {
            capReq = req;
            return new DeleteCustomTrainingContainerResponse();
          },
        });
      });
    });

    it('delete custom training container', async () => {
      expect(await subject().deleteCustomTrainingContainer(id)).toEqual(null);
      expect(capReq.id).toStrictEqual(id);
    });
  });
});
