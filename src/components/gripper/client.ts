import { create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';

import { GetGeometriesRequestSchema } from '../../gen/common/v1/common_pb';
import {
  GetCurrentInputsRequestSchema,
  GoToInputsRequestSchema,
  GrabRequestSchema,
  GripperService,
  IsHoldingSomethingRequestSchema,
  IsMovingRequestSchema,
  OpenRequestSchema,
  StopRequestSchema,
} from '../../gen/component/gripper/v1/gripper_pb';
import type { RobotClient } from '../../robot';
import type { JsonObject, Options } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { Gripper } from './gripper';

/**
 * A gRPC-web client for the Gripper component.
 *
 * @group Clients
 */
export class GripperClient implements Gripper {
  private client: Client<typeof GripperService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GripperService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    const request = create(GetGeometriesRequestSchema, {
      name: this.name,
      extra,
    });

    const response = await this.client.getGeometries(request, callOptions);
    return response.geometries;
  }

  async open(extra = {}, callOptions = this.callOptions) {
    const request = create(OpenRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    await this.client.open(request, callOptions);
  }

  async grab(extra = {}, callOptions = this.callOptions) {
    const request = create(GrabRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    await this.client.grab(request, callOptions);
  }

  async stop(extra = {}, callOptions = this.callOptions) {
    const request = create(StopRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request, callOptions);
  }

  async isMoving(callOptions = this.callOptions) {
    const request = create(IsMovingRequestSchema, {
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isMoving(request, callOptions);
    return resp.isMoving;
  }

  async isHoldingSomething(extra = {}, callOptions = this.callOptions) {
    const request = create(IsHoldingSomethingRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isHoldingSomething(request, callOptions);
    return resp.isHoldingSomething;
  }

  async getCurrentInputs(extra = {}, callOptions = this.callOptions) {
    const request = create(GetCurrentInputsRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getCurrentInputs(request, callOptions);
    return resp.values;
  }

  async goToInputs(
    values: number[],
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = create(GoToInputsRequestSchema, {
      name: this.name,
      values,
      extra,
    });

    this.options.requestLogger?.(request);

    await this.client.goToInputs(request, callOptions);
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}
