import { create, type MessageInitShape } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import type {
  GeoGeometrySchema,
  GeometrySchema,
  GeoPointSchema,
  PoseInFrameSchema,
  PoseSchema,
  TransformSchema,
  WorldStateSchema,
} from "../../gen/common/v1/common_pb";
import {
  ConstraintsSchema,
  GetPlanRequestSchema,
  GetPoseRequestSchema,
  ListPlanStatusesRequestSchema,
  MotionConfigurationSchema,
  MotionService,
  MoveOnGlobeRequestSchema,
  MoveOnMapRequestSchema,
  MoveRequestSchema,
  StopPlanRequestSchema,
} from "../../gen/service/motion/v1/motion_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { Motion } from "./motion";

/**
 * A gRPC-web client for a Motion service.
 *
 * @group Clients
 */
export class MotionClient implements Motion {
  private client: Client<typeof MotionService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotionService);
    this.name = name;
    this.options = options;
  }

  async move(
    destination: MessageInitShape<typeof PoseInFrameSchema>,
    componentName: string,
    worldState?: MessageInitShape<typeof WorldStateSchema>,
    constraints?: MessageInitShape<typeof ConstraintsSchema>,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(MoveRequestSchema, {
      name: this.name,
      destination,
      componentName,
      worldState,
      constraints,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.move(request, callOptions);
    return resp.success;
  }

  async moveOnMap(
    destination: MessageInitShape<typeof PoseSchema>,
    componentName: string,
    slamServiceName: string,
    motionConfig?: MessageInitShape<typeof MotionConfigurationSchema>,
    obstacles?: MessageInitShape<typeof GeometrySchema>[],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(MoveOnMapRequestSchema, {
      name: this.name,
      destination,
      componentName,
      slamServiceName,
      motionConfiguration: motionConfig,
      obstacles,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.moveOnMap(request, callOptions);
    return resp.executionId;
  }

  async moveOnGlobe(
    destination: MessageInitShape<typeof GeoPointSchema>,
    componentName: string,
    movementSensorName: string,
    heading?: number,
    obstaclesList?: MessageInitShape<typeof GeoGeometrySchema>[],
    motionConfig?: MessageInitShape<typeof MotionConfigurationSchema>,
    boundingRegionsList?: MessageInitShape<typeof GeoGeometrySchema>[],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(MoveOnGlobeRequestSchema, {
      name: this.name,
      destination,
      componentName,
      movementSensorName,
      heading,
      obstacles: obstaclesList,
      boundingRegions: boundingRegionsList,
      motionConfiguration: motionConfig,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.moveOnGlobe(request, callOptions);
    return resp.executionId;
  }

  async stopPlan(
    componentName: string,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(StopPlanRequestSchema, {
      name: this.name,
      componentName,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.stopPlan(request, callOptions);
    return null;
  }

  async getPlan(
    componentName: string,
    lastPlanOnly?: boolean,
    executionId?: string,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetPlanRequestSchema, {
      name: this.name,
      componentName,
      lastPlanOnly,
      executionId,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    return this.client.getPlan(request, callOptions);
  }

  async listPlanStatuses(
    onlyActivePlans?: boolean,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(ListPlanStatusesRequestSchema, {
      name: this.name,
      onlyActivePlans,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    return this.client.listPlanStatuses(request, callOptions);
  }

  /** @deprecated Use `RobotClient.getPose` instead. */
  async getPose(
    componentName: string,
    destinationFrame: string,
    supplementalTransforms: MessageInitShape<typeof TransformSchema>[],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetPoseRequestSchema, {
      name: this.name,
      componentName,
      destinationFrame,
      supplementalTransforms,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getPose(request, callOptions);

    const result = response.pose;

    if (!result) {
      throw new Error("no pose");
    }

    return result;
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
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
