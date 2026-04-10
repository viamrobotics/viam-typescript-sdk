import { create, type MessageInitShape } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';

import {
  FlatTensorsSchema,
  InferRequestSchema,
  MetadataRequestSchema,
  MLModelService,
} from '../../gen/service/mlmodel/v1/mlmodel_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import type { MLModel } from './ml-model';

export class MLModelClient implements MLModel {
  private client: Client<typeof MLModelService>;
  private readonly options: Options;

  public readonly name: string;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MLModelService);
    this.name = name;
    this.options = options;
  }

  async metadata(extra = {}, callOptions = this.callOptions) {
    const request = create(MetadataRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    return this.client.metadata(request, callOptions);
  }

  async infer(
    inputTensors: MessageInitShape<typeof FlatTensorsSchema>,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = create(InferRequestSchema, {
      name: this.name,
      inputTensors,
      extra,
    });

    this.options.requestLogger?.(request);

    return this.client.infer(request, callOptions);
  }
}
