import type { CallOptions, Client } from '@connectrpc/connect';
import { create } from '@bufbuild/protobuf';
import type { FlatTensors, MLModel } from './ml-model';
import { type Options } from '../../types';
import type { RobotClient } from '../../robot';
import {
  InferRequestSchema,
  MetadataRequestSchema,
  MLModelService,
} from '../../gen/service/mlmodel/v1/mlmodel_pb';

export class MLModelClient implements MLModel {
  private client: Client<typeof MLModelService>;
  private readonly options: Options;

  public readonly name: string;
  public callOptions: CallOptions = { headers: {} };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MLModelService);
    this.name = name;
    this.options = options;
  }

  async metadata(extra = {}, callOptions = this.callOptions) {
    const request = create(MetadataRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    return this.client.metadata(request, callOptions);
  }

  async infer(inputTensors: FlatTensors, extra = {}, callOptions = this.callOptions) {
    const request = create(InferRequestSchema, {
      name: this.name,
      inputTensors,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    return this.client.infer(request, callOptions);
  }
}
