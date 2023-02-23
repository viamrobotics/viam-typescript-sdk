import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb';
import type Client from '../../Client';
import type { MovementSensor } from './MovementSensor';
import { MovementSensorServiceClient } from '../../gen/component/movementsensor/v1/movementsensor_pb_service.esm';
import type { Options } from '../../types';
import pb from '../../gen/component/movementsensor/v1/movementsensor_pb.esm';
import { promisify } from '../../utils';

export class MovementSensorClient implements MovementSensor {
  private client: MovementSensorServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: Client, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MovementSensorServiceClient);
    this.name = name;
    this.options = options;
  }

  private get movementsensorService() {
    return this.client;
  }

  async getLinearVelocity(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetLinearVelocityRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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

    return {
      x: vel.getX(),
      y: vel.getY(),
      z: vel.getZ(),
    };
  }

  async getAngularVelocity(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetAngularVelocityRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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

    return {
      x: ang.getX(),
      y: ang.getY(),
      z: ang.getZ(),
    };
  }

  async getCompassHeading(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetCompassHeadingRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetOrientationRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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

    return {
      ox: ori.getOX(),
      oy: ori.getOY(),
      oz: ori.getOZ(),
      theta: ori.getTheta(),
    };
  }

  async getPosition(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetPositionRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPositionRequest,
      pb.GetPositionResponse
    >(movementsensorService.getPosition.bind(movementsensorService), request);

    const coordinate = response.getCoordinate();
    if (!coordinate) {
      throw new Error('no coordinate');
    }

    return {
      latitude: coordinate.getLatitude(),
      longitude: coordinate.getLongitude(),
      altitudeMM: response.getAltitudeMm(),
    };
  }

  async getProperties(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetPropertiesRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPropertiesRequest,
      pb.GetPropertiesResponse
    >(movementsensorService.getProperties.bind(movementsensorService), request);

    return {
      linearVelocitySupported: response.getLinearVelocitySupported(),
      angularVelocitySupported: response.getAngularVelocitySupported(),
      orientationSupported: response.getOrientationSupported(),
      positionSupported: response.getPositionSupported(),
      compassHeadingSupported: response.getCompassHeadingSupported(),
      linearAccelerationSupported: response.getLinearAccelerationSupported(),
    };
  }

  async getAccuracy(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetAccuracyRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetAccuracyRequest,
      pb.GetAccuracyResponse
    >(movementsensorService.getAccuracy.bind(movementsensorService), request);

    const acc = response.getAccuracyMmMap();
    const result: Record<string, number> = {};
    for (const [key, value] of acc.entries()) {
      result[key] = value;
    }
    return result;
  }

  async getLinearAcceleration(extra = {}) {
    const movementsensorService = this.movementsensorService;
    const request = new pb.GetLinearAccelerationRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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

    return {
      x: acc.getX(),
      y: acc.getY(),
      z: acc.getZ(),
    };
  }
}
