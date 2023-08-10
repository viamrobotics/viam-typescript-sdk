import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import pb from '../../gen/service/motion/v1/motion_pb';
import type { RobotClient } from '../../robot';
import { MotionServiceClient } from '../../gen/service/motion/v1/motion_pb_service';
import {
  promisify,
  doCommandFromClient,
  encodeResourceName,
  encodePose,
  encodePoseInFrame,
  encodeWorldState,
  encodeTransform,
  encodeGeoPoint,
  encodeGeoObstacle,
} from '../../utils';
import type {
  GeoObstacle,
  GeoPoint,
  Options,
  Pose,
  PoseInFrame,
  ResourceName,
  StructType,
  Transform,
  WorldState,
} from '../../types';
import { type Constraints, encodeConstraints } from './types';
import type { Motion } from './motion';

/**
 * A gRPC-web client for a Motion service.
 *
 * @group Clients
 */
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
    destination: PoseInFrame,
    componentName: ResourceName,
    worldState?: WorldState,
    constraints?: Constraints,
    extra = {}
  ) {
    const { service } = this;

    const request = new pb.MoveRequest();
    request.setName(this.name);
    request.setDestination(encodePoseInFrame(destination));
    request.setComponentName(encodeResourceName(componentName));
    if (worldState !== undefined) {
      request.setWorldState(encodeWorldState(worldState));
    }
    if (constraints !== undefined) {
      request.setConstraints(encodeConstraints(constraints));
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
    destination: Pose,
    componentName: ResourceName,
    slamServiceName: ResourceName,
    extra = {}
  ) {
    const { service } = this;

    const request = new pb.MoveOnMapRequest();
    request.setName(this.name);
    request.setDestination(encodePose(destination));
    request.setComponentName(encodeResourceName(componentName));
    request.setSlamServiceName(encodeResourceName(slamServiceName));
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.MoveOnMapRequest, pb.MoveOnMapResponse>(
      service.moveOnMap.bind(service),
      request
    );

    return response.getSuccess();
  }

  async moveOnGlobe(
    destination: GeoPoint,
    componentName: ResourceName,
    movementSensorName: ResourceName,
    heading?: number,
    obstaclesList?: GeoObstacle[],
    linearMetersPerSec?: number,
    angularDegPerSec?: number,
    extra = {}
  ) {
    const { service } = this;

    const request = new pb.MoveOnGlobeRequest();
    request.setDestination(encodeGeoPoint(destination));
    request.setComponentName(encodeResourceName(componentName));
    request.setMovementSensorName(encodeResourceName(movementSensorName));
    if (heading) {
      request.setHeading(heading);
    }
    if (obstaclesList) {
      request.setObstaclesList(obstaclesList.map((x) => encodeGeoObstacle(x)));
    }
    if (linearMetersPerSec) {
      request.setLinearMetersPerSec(linearMetersPerSec);
    }
    if (angularDegPerSec) {
      request.setAngularDegPerSec(angularDegPerSec);
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.MoveOnGlobeRequest,
      pb.MoveOnGlobeResponse
    >(service.moveOnGlobe.bind(service), request);

    return response.getSuccess();
  }

  async getPose(
    componentName: ResourceName,
    destinationFrame: string,
    supplementalTransforms: Transform[],
    extra = {}
  ) {
    const { service } = this;

    const request = new pb.GetPoseRequest();
    request.setName(this.name);
    request.setComponentName(encodeResourceName(componentName));
    request.setDestinationFrame(destinationFrame);
    request.setSupplementalTransformsList(
      supplementalTransforms.map((x) => encodeTransform(x))
    );
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

    return result.toObject();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { service } = this;
    return doCommandFromClient(service, this.name, command, this.options);
  }
}
