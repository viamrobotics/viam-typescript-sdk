import type { RobotClient } from '../../robot';
import { MotionServiceClient } from '../../gen/service/motion/v1/motion_pb_service';
import type { Options } from '../../types';
import { promisify } from '../../utils';
import type { Motion } from './Motion';

import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import common from '../../gen/common/v1/common_pb';
import pb from '../../gen/service/motion/v1/motion_pb';

export class MotionClient implements Motion {
  private client: MotionServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotionServiceClient);
    this.name = name;
    this.options = options;
  }

  private get service() {
    return this.client;
  }

  async move(
    destination: common.PoseInFrame,
    componentName: common.ResourceName,
    worldState?: common.WorldState,
    constraints?: pb.Constraints,
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.MoveRequest();
    request.setName(this.name);
    request.setDestination(destination);
    request.setComponentName(componentName);
    if (worldState !== undefined) {
      request.setWorldState(worldState);
    }
    if (constraints !== undefined) {
      request.setConstraints(constraints);
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.MoveRequest, pb.MoveResponse>(
      service.move.bind(service),
      request
    );

    return response.getSuccess();
  }

  async moveOnMap(
    destination: common.Pose,
    componentName: common.ResourceName,
    slamServiceName: common.ResourceName,
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.MoveOnMapRequest();
    request.setName(this.name);
    request.setDestination(destination);
    request.setComponentName(componentName);
    request.setSlamServiceName(slamServiceName);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.MoveOnMapRequest, pb.MoveOnMapResponse>(
      service.moveOnMap.bind(service),
      request
    );

    return response.getSuccess();
  }

  async moveSingleComponent(
    destination: common.PoseInFrame,
    componentName: common.ResourceName,
    worldState?: common.WorldState,
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.MoveSingleComponentRequest();
    request.setName(this.name);
    request.setDestination(destination);
    request.setComponentName(componentName);
    if (worldState !== undefined) {
      request.setWorldState(worldState);
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.MoveSingleComponentRequest,
      pb.MoveSingleComponentResponse
    >(service.moveSingleComponent.bind(service), request);

    return response.getSuccess();
  }

  async getPose(
    componentName: common.ResourceName,
    destinationFrame: string,
    supplementalTransforms: common.Transform[],
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.GetPoseRequest();
    request.setName(this.name);
    request.setComponentName(componentName);
    request.setDestinationFrame(destinationFrame);
    request.setSupplementalTransformsList(supplementalTransforms);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.GetPoseRequest, pb.GetPoseResponse>(
      service.getPose.bind(service),
      request
    );

    const result = response.getPose();

    if (!result) {
      throw new Error('no pose');
    }

    return result;
  }
}
