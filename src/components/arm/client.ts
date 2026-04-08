import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  Get3DModelsRequestSchema,
  type Mesh,
} from "../../gen/common/v1/common_pb";
import {
  ArmService,
  GetEndPositionRequestSchema,
  GetJointPositionsRequestSchema,
  IsMovingRequestSchema,
  JointPositionsSchema,
  MoveToJointPositionsRequestSchema,
  MoveToPositionRequestSchema,
  StopRequestSchema,
} from "../../gen/component/arm/v1/arm_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options, Pose } from "../../types";
import type { GetKinematicsResult } from "../../utils";
import {
  doCommandFromClient,
  getGeometriesFromClient,
  getKinematicsFromClient,
  getStatusFromClient,
} from "../../utils";
import type { Arm } from "./arm";

/**
 * A gRPC-web client for the Arm component.
 *
 * @group Clients
 */
export class ArmClient implements Arm {
  private client: Client<typeof ArmService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(ArmService);
    this.name = name;
    this.options = options;
  }

  async getEndPosition(extra = {}, callOptions = this.callOptions) {
    const request = create(GetEndPositionRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getEndPosition(request, callOptions);
    const result = response.pose;
    if (!result) {
      throw new Error("no pose");
    }
    return result;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    return getGeometriesFromClient(
      this.client.getGeometries,
      this.name,
      extra,
      callOptions,
    );
  }

  async getKinematics(
    extra = {},
    callOptions = this.callOptions,
  ): Promise<GetKinematicsResult> {
    return getKinematicsFromClient(
      this.client.getKinematics,
      this.name,
      extra,
      callOptions,
    );
  }

  async get3DModels(
    extra = {},
    callOptions = this.callOptions,
  ): Promise<Record<string, Mesh>> {
    const request = create(Get3DModelsRequestSchema, {
      name: this.name,
      extra: extra,
    });

    const response = await this.client.get3DModels(request, callOptions);
    return response.models;
  }

  async moveToPosition(pose: Pose, extra = {}, callOptions = this.callOptions) {
    const request = create(MoveToPositionRequestSchema, {
      name: this.name,
      to: pose,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.moveToPosition(request, callOptions);
  }

  async moveToJointPositions(
    jointPositionsList: number[],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const newJointPositions = create(JointPositionsSchema, {
      values: jointPositionsList,
    });

    const request = create(MoveToJointPositionsRequestSchema, {
      name: this.name,
      positions: newJointPositions,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.moveToJointPositions(request, callOptions);
  }

  async getJointPositions(extra = {}, callOptions = this.callOptions) {
    const request = create(GetJointPositionsRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getJointPositions(request, callOptions);

    const result = response.positions;
    if (!result) {
      throw new Error("no pose");
    }
    return result;
  }

  async stop(extra = {}, callOptions = this.callOptions) {
    const request = create(StopRequestSchema, {
      name: this.name,
      extra: extra,
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

  async getStatus(callOptions = this.callOptions) {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions,
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions,
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
