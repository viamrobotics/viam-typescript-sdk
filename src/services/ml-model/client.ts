import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import type { FlatTensors, MLModel } from './ml-model';
import { Struct, type Options } from '../../types';
import type { RobotClient } from '../../robot';
import {
  InferRequest,
  MetadataRequest,
} from '../../gen/service/mlmodel/v1/mlmodel_pb';
import { MLModelService } from '../../gen/service/mlmodel/v1/mlmodel_connect';

export class MLModelClient implements MLModel {
  private client: PromiseClient<typeof MLModelService>;
  private readonly options: Options;

  public readonly name: string;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MLModelService);
    this.name = name;
    this.options = options;
  }

  async metadata(extra = {}, callOptions = this.callOptions) {
    const request = new MetadataRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.metadata(request, callOptions);
  }

  async infer(
    inputTensors: FlatTensors,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new InferRequest({
      name: this.name,
      inputTensors,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.infer(request, callOptions);
  }
}
