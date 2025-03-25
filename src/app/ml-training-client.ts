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

  /**
   * Submit a training job.
   *
   * @param organizationId - The organization ID.
   * @param datasetId - The dataset ID.
   * @param modelName - The model name.
   * @param modelVersion - The model version.
   * @param modelType - The model type.
   * @param tags - The tags.
   *
   * @example
   * ```ts
   * const mlTraining = new VIAM.MlTrainingClient(machine, 'my_ml_training');
   * await mlTraining.submitTrainingJob(
   *   '<organization-id>',
   *   '<dataset-id>',
   *   '<your-model-name>',
   *   '1.0.0',
   *   ModelType.SINGLE_LABEL_CLASSIFICATION,
   *   ['tag1', 'tag2']
   * );
   * ```
   */
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

  /**
   * Submit a training job from a custom training script.
   *
   * @param organizationId - The organization ID.
   * @param datasetId - The dataset ID.
   * @param registryItemId - The registry item ID.
   * @param registryItemVersion - The registry item version.
   * @param modelName - The model name.
   * @param modelVersion - The model version.
   *
   * @example
   * ```ts
   * const mlTraining = new VIAM.MlTrainingClient(machine, 'my_ml_training');
   * await mlTraining.submitCustomTrainingJob(
   *   '<organization-id>',
   *   '<dataset-id>',
   *   'viam:classification-tflite',
   *   '1.0.0',
   *   '<your-model-name>',
   *   '1.0.0'
   * );
   * ```
   */
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

 /**
  * Get a training job metadata.
  *
  * @param id - The training job ID.
  *
  * @example
  * ```ts
  * const mlTraining = new VIAM.MlTrainingClient(machine, 'my_ml_training');
  * const job = await mlTraining.getTrainingJob('<training-job-id>');
  * console.log(job);
  * ```
  */
  async getTrainingJob(id: string) {
    const resp = await this.client.getTrainingJob({ id });
    return resp.metadata;
  }

 /**
  * List training jobs.
  *
  * @param organizationId - The organization ID.
  * @param status - The training job status.
  *
  * @example
  * ```ts
  * const mlTraining = new VIAM.MlTrainingClient(machine, 'my_ml_training');
  * const jobs = await mlTraining.listTrainingJobs(
  *   '<organization-id>',
  *   TrainingStatus.RUNNING
  * );
  * console.log(jobs);
  * ```
  */
  async listTrainingJobs(organizationId: string, status: TrainingStatus) {
    const resp = await this.client.listTrainingJobs({ organizationId, status });
    return resp.jobs;
  }

 /**
  * Cancel a training job.
  *
  * @param id - The training job ID.
  *
  * @example
  * ```ts
  * const mlTraining = new VIAM.MlTrainingClient(machine, 'my_ml_training');
  * await mlTraining.cancelTrainingJob('<training-job-id>');
  * ```
  */
  async cancelTrainingJob(id: string) {
    await this.client.cancelTrainingJob({ id });
    return null;
  }

  /**
   * Delete a completed training job.
   *
   * @param id - The training job ID.
   *
   * @example
   * ```ts
   * const mlTraining = new VIAM.MlTrainingClient(machine, 'my_ml_training');
   * await mlTraining.deleteCompletedTrainingJob('<training-job-id>');
   * ```
   */
  async deleteCompletedTrainingJob(id: string) {
    await this.client.deleteCompletedTrainingJob({ id });
    return null;
  }
}

export {
  ModelType,
  TrainingStatus,
} from '../gen/app/mltraining/v1/ml_training_pb';
