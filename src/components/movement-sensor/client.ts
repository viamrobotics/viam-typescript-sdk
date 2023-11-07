import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import { MovementSensorServiceClient } from '../../gen/component/movementsensor/v1/movementsensor_pb_service';
import type { Options, StructType } from '../../types';
import pb from '../../gen/component/movementsensor/v1/movementsensor_pb';
import { promisify, doCommandFromClient } from '../../utils';
import {
  GetReadingsRequest,
  GetReadingsResponse,
} from '../../gen/common/v1/common_pb';
import type { MovementSensor } from './movement-sensor';

/**
 * A gRPC-web client for the MovementSensor component.
 *
 * @group Clients
 */
export class MovementSensorClient implements MovementSensor {
  private client: MovementSensorServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MovementSensorServiceClient);
    this.name = name;
    this.options = options;
  }

  private get movementsensorService() {
    return this.client;
  }

  async getLinearVelocity(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetLinearVelocityRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetLinearVelocityRequest,
      pb.GetLinearVelocityResponse
    >(
      movementsensorService.getLinearVelocity.bind(movementsensorService),
      request
    );

    const vel = response.getLinearVelocity();
    if (!vel) {
      throw new Error('no linear velocity');
    }

    return vel.toObject();
  }

  async getAngularVelocity(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetAngularVelocityRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetAngularVelocityRequest,
      pb.GetAngularVelocityResponse
    >(
      movementsensorService.getAngularVelocity.bind(movementsensorService),
      request
    );

    const ang = response.getAngularVelocity();
    if (!ang) {
      throw new Error('no angular velocity');
    }

    return ang.toObject();
  }

  async getCompassHeading(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetCompassHeadingRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetCompassHeadingRequest,
      pb.GetCompassHeadingResponse
    >(
      movementsensorService.getCompassHeading.bind(movementsensorService),
      request
    );

    return response.getValue();
  }

  async getOrientation(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetOrientationRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetOrientationRequest,
      pb.GetOrientationResponse
    >(
      movementsensorService.getOrientation.bind(movementsensorService),
      request
    );

    const ori = response.getOrientation();
    if (!ori) {
      throw new Error('no orientation');
    }

    return ori.toObject();
  }

  async getPosition(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetPositionRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPositionRequest,
      pb.GetPositionResponse
    >(movementsensorService.getPosition.bind(movementsensorService), request);

    return response.toObject();
  }

  async getProperties(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetPropertiesRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPropertiesRequest,
      pb.GetPropertiesResponse
    >(movementsensorService.getProperties.bind(movementsensorService), request);

    return response.toObject();
  }

  async getAccuracy(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetAccuracyRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetAccuracyRequest,
      pb.GetAccuracyResponse
    >(movementsensorService.getAccuracy.bind(movementsensorService), request);

    const acc = response.getAccuracyMap();
    const result: Record<string, number> = {};
    for (const [key, value] of acc.entries()) {
      result[key] = value;
    }
    return result;
  }

  async getLinearAcceleration(extra = {}) {
    const { movementsensorService } = this;
    const request = new pb.GetLinearAccelerationRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetLinearAccelerationRequest,
      pb.GetLinearAccelerationResponse
    >(
      movementsensorService.getLinearAcceleration.bind(movementsensorService),
      request
    );

    const acc = response.getLinearAcceleration();
    if (!acc) {
      throw new Error('no linear acceleration');
    }

    return acc.toObject();
  }

  async getReadings(extra = {}) {
    const { movementsensorService } = this;
    const request = new GetReadingsRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<GetReadingsRequest, GetReadingsResponse>(
      movementsensorService.getReadings.bind(movementsensorService),
      request
    );

    const result: Record<string, unknown> = {};
    for (const [key, value] of response.getReadingsMap().entries()) {
      result[key] = value.toJavaScript();
    }
    return result;
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { movementsensorService } = this;
    return doCommandFromClient(
      movementsensorService,
      this.name,
      command,
      this.options
    );
  }
}
