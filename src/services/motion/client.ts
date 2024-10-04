import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { MotionService } from '../../gen/service/motion/v1/motion_connect';
import {
  GetPlanRequest,
  GetPoseRequest,
  ListPlanStatusesRequest,
  MoveOnGlobeRequest,
  MoveOnMapRequest,
  MoveRequest,
  StopPlanRequest,
} from '../../gen/service/motion/v1/motion_pb';
import type { RobotClient } from '../../robot';
import type {
  GeoGeometry,
  GeoPoint,
  Geometry,
  Options,
  Pose,
  PoseInFrame,
  ResourceName,
  Transform,
  WorldState,
} from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Motion } from './motion';
import { type Constraints, type MotionConfiguration } from './types';

/**
 * A gRPC-web client for a Motion service.
 *
 * @group Clients
 */
export class MotionClient implements Motion {
  private client: PromiseClient<typeof MotionService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotionService);
    this.name = name;
    this.options = options;
  }

  async move(
    destination: PoseInFrame,
    componentName: ResourceName,
    worldState?: WorldState,
    constraints?: Constraints,
    extra = {}
  ) {
    const request = new MoveRequest({
      name: this.name,
      destination,
      componentName,
      worldState,
      constraints,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.move(request);
    return resp.success;
  }

  async moveOnMap(
    destination: Pose,
    componentName: ResourceName,
    slamServiceName: ResourceName,
    motionConfig?: MotionConfiguration,
    obstacles?: Geometry[],
    extra = {}
  ) {
    const request = new MoveOnMapRequest({
      name: this.name,
      destination,
      componentName,
      slamServiceName,
      motionConfiguration: motionConfig,
      obstacles,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.moveOnMap(request);
    return resp.executionId;
  }

  async moveOnGlobe(
    destination: GeoPoint,
    componentName: ResourceName,
    movementSensorName: ResourceName,
    heading?: number,
    obstaclesList?: GeoGeometry[],
    motionConfig?: MotionConfiguration,
    boundingRegionsList?: GeoGeometry[],
    extra = {}
  ) {
    const request = new MoveOnGlobeRequest({
      name: this.name,
      destination,
      componentName,
      movementSensorName,
      heading,
      obstacles: obstaclesList,
      boundingRegions: boundingRegionsList,
      motionConfiguration: motionConfig,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.moveOnGlobe(request);
    return resp.executionId;
  }

  async stopPlan(componentName: ResourceName, extra = {}) {
    const request = new StopPlanRequest({
      name: this.name,
      componentName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.stopPlan(request);
    return null;
  }

  async getPlan(
    componentName: ResourceName,
    lastPlanOnly?: boolean,
    executionId?: string,
    extra = {}
  ) {
    const request = new GetPlanRequest({
      name: this.name,
      componentName,
      lastPlanOnly,
      executionId,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getPlan(request);
  }

  async listPlanStatuses(onlyActivePlans?: boolean, extra = {}) {
    const request = new ListPlanStatusesRequest({
      name: this.name,
      onlyActivePlans,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.listPlanStatuses(request);
  }

  async getPose(
    componentName: ResourceName,
    destinationFrame: string,
    supplementalTransforms: Transform[],
    extra = {}
  ) {
    const request = new GetPoseRequest({
      name: this.name,
      componentName,
      destinationFrame,
      supplementalTransforms,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getPose(request);

    const result = response.pose;

    if (!result) {
      throw new Error('no pose');
    }

    return result;
  }

  async doCommand(command: Struct): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options
    );
  }
}
