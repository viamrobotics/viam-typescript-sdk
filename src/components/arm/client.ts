import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { ArmService } from '../../gen/component/arm/v1/arm_connect';
import {
  GetEndPositionRequest,
  GetJointPositionsRequest,
  IsMovingRequest,
  JointPositions,
  MoveToJointPositionsRequest,
  MoveToPositionRequest,
  StopRequest,
} from '../../gen/component/arm/v1/arm_pb';
import type { RobotClient } from '../../robot';
import type { Options, Pose } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Arm } from './arm';

/**
 * A gRPC-web client for the Arm component.
 *
 * @group Clients
 */
export class ArmClient implements Arm {
  private client: PromiseClient<typeof ArmService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(ArmService);
    this.name = name;
    this.options = options;
  }

  async getEndPosition(extra = {}, callOptions = this.callOptions) {
    const request = new GetEndPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getEndPosition(request, callOptions);
    const result = response.pose;
    if (!result) {
      throw new Error('no pose');
    }
    return result;
  }

  async moveToPosition(pose: Pose, extra = {}, callOptions = this.callOptions) {
    const request = new MoveToPositionRequest({
      name: this.name,
      to: pose,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.moveToPosition(request, callOptions);
  }

  async moveToJointPositions(
    jointPositionsList: number[],
    extra = {},
    callOptions = this.callOptions
  ) {
    const newJointPositions = new JointPositions({
      values: jointPositionsList,
    });

    const request = new MoveToJointPositionsRequest({
      name: this.name,
      positions: newJointPositions,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.moveToJointPositions(request, callOptions);
  }

  async getJointPositions(extra = {}, callOptions = this.callOptions) {
    const request = new GetJointPositionsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getJointPositions(request, callOptions);

    const result = response.positions;
    if (!result) {
      throw new Error('no pose');
    }
    return result;
  }

  async stop(extra = {}, callOptions = this.callOptions) {
    const request = new StopRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stop(request, callOptions);
  }

  async isMoving(callOptions = this.callOptions) {
    const request = new IsMovingRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.isMoving(request, callOptions);
    return resp.isMoving;
  }

  async doCommand(
    command: Struct,
    callOptions = this.callOptions
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}
