import {
  createPromiseClient,
  type PromiseClient,
  type Transport,
} from '@connectrpc/connect';
import { MLTrainingService } from '../gen/app/mltraining/v1/ml_training_connect';

import {
  ModelType,
  TrainingStatus,
} from '../gen/app/mltraining/v1/ml_training_pb';

export class MlTrainingClient {
  private client: PromiseClient<typeof MLTrainingService>;

  constructor(transport: Transport) {
    this.client = createPromiseClient(MLTrainingService, transport);
  }

  async submitTrainingJob(
    organizationId: string,
    datasetId: string,
    modelName: string,
    modelVersion: string,
    modelType: ModelType,
    tags: string[]
  ) {
    const resp = await this.client.submitTrainingJob({
      organizationId,
      datasetId,
      modelName,
      modelVersion,
      modelType,
      tags,
    });
    return resp.id;
  }

  async submitCustomTrainingJob(
    organizationId: string,
    datasetId: string,
    registryItemId: string,
    registryItemVersion: string,
    modelName: string,
    modelVersion: string
  ) {
    const resp = await this.client.submitCustomTrainingJob({
      organizationId,
      datasetId,
      registryItemId,
      registryItemVersion,
      modelName,
      modelVersion,
    });
    return resp.id;
  }

  async getTrainingJob(id: string) {
    const resp = await this.client.getTrainingJob({ id });
    return resp.metadata;
  }

  async listTrainingJobs(organizationId: string, status: TrainingStatus) {
    const resp = await this.client.listTrainingJobs({ organizationId, status });
    return resp.jobs;
  }

  async cancelTrainingJob(id: string) {
    await this.client.cancelTrainingJob({ id });
    return null;
  }

  async deleteCompletedTrainingJob(id: string) {
    await this.client.deleteCompletedTrainingJob({ id });
    return null;
  }
}

export {
  ModelType,
  TrainingStatus,
} from '../gen/app/mltraining/v1/ml_training_pb';
