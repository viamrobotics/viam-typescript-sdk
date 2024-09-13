import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import { MLTrainingServiceClient } from '../gen/app/mltraining/v1/ml_training_pb_service';
import pb from '../gen/app/mltraining/v1/ml_training_pb';
import { promisify } from '../utils';

type ValueOf<T> = T[keyof T];
export const { ModelType } = pb;
export type ModelType = ValueOf<typeof pb.ModelType>;
export const { TrainingStatus } = pb;
export type TrainingStatus = ValueOf<typeof pb.TrainingStatus>;

export class MlTrainingClient {
  private service: MLTrainingServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new MLTrainingServiceClient(serviceHost, grpcOptions);
  }

  async submitTrainingJob(
    orgId: string,
    datasetId: string,
    modelName: string,
    modelVersion: string,
    modelType: ModelType,
    tagsList: string[]
  ) {
    const { service } = this;

    const req = new pb.SubmitTrainingJobRequest();
    req.setOrganizationId(orgId);
    req.setDatasetId(datasetId);
    req.setModelName(modelName);
    req.setModelVersion(modelVersion);
    req.setModelType(modelType);
    req.setTagsList(tagsList);

    const response = await promisify<
      pb.SubmitTrainingJobRequest,
      pb.SubmitTrainingJobResponse
    >(service.submitTrainingJob.bind(service), req);
    return response.getId();
  }

  async submitCustomTrainingJob(
    orgId: string,
    datasetId: string,
    registryItemId: string,
    registryItemVersion: string,
    modelName: string,
    modelVersion: string
  ) {
    const { service } = this;

    const req = new pb.SubmitCustomTrainingJobRequest();
    req.setOrganizationId(orgId);
    req.setDatasetId(datasetId);
    req.setRegistryItemId(registryItemId);
    req.setRegistryItemVersion(registryItemVersion);
    req.setModelName(modelName);
    req.setModelVersion(modelVersion);

    const response = await promisify<
      pb.SubmitCustomTrainingJobRequest,
      pb.SubmitCustomTrainingJobResponse
    >(service.submitCustomTrainingJob.bind(service), req);
    return response.getId();
  }

  async getTrainingJob(id: string) {
    const { service } = this;

    const req = new pb.GetTrainingJobRequest();
    req.setId(id);

    const response = await promisify<
      pb.GetTrainingJobRequest,
      pb.GetTrainingJobResponse
    >(service.getTrainingJob.bind(service), req);
    return response.getMetadata();
  }

  async listTrainingJobs(orgId: string, status: TrainingStatus) {
    const { service } = this;

    const req = new pb.ListTrainingJobsRequest();
    req.setOrganizationId(orgId);
    req.setStatus(status);

    const response = await promisify<
      pb.ListTrainingJobsRequest,
      pb.ListTrainingJobsResponse
    >(service.listTrainingJobs.bind(service), req);
    return response.toObject().jobsList;
  }

  async cancelTrainingJob(id: string) {
    const { service } = this;

    const req = new pb.CancelTrainingJobRequest();
    req.setId(id);

    await promisify<pb.CancelTrainingJobRequest, pb.CancelTrainingJobResponse>(
      service.cancelTrainingJob.bind(service),
      req
    );
    return null;
  }

  async deleteCompletedTrainingJob(id: string) {
    const { service } = this;

    const req = new pb.DeleteCompletedTrainingJobRequest();
    req.setId(id);

    await promisify<
      pb.DeleteCompletedTrainingJobRequest,
      pb.DeleteCompletedTrainingJobResponse
    >(service.deleteCompletedTrainingJob.bind(service), req);
    return null;
  }
}
