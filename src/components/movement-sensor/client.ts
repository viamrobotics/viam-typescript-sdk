import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { GetReadingsRequest } from '../../gen/common/v1/common_pb';
import { MovementSensorService } from '../../gen/component/movementsensor/v1/movementsensor_connect';
import {
  GetAccuracyRequest,
  GetAngularVelocityRequest,
  GetCompassHeadingRequest,
  GetLinearAccelerationRequest,
  GetLinearVelocityRequest,
  GetOrientationRequest,
  GetPositionRequest,
  GetPropertiesRequest,
} from '../../gen/component/movementsensor/v1/movementsensor_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { MovementSensor } from './movement-sensor';

/**
 * A gRPC-web client for the MovementSensor component.
 *
 * @group Clients
 */
export class MovementSensorClient implements MovementSensor {
  private client: PromiseClient<typeof MovementSensorService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MovementSensorService);
    this.name = name;
    this.options = options;
  }

  async getLinearVelocity(extra = {}) {
    const request = new GetLinearVelocityRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getLinearVelocity(request);

    const vel = response.linearVelocity;
    if (!vel) {
      throw new Error('no linear velocity');
    }

    return vel;
  }

  async getAngularVelocity(extra = {}) {
    const request = new GetAngularVelocityRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getAngularVelocity(request);

    const ang = response.angularVelocity;
    if (!ang) {
      throw new Error('no angular velocity');
    }

    return ang;
  }

  async getCompassHeading(extra = {}) {
    const request = new GetCompassHeadingRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getCompassHeading(request);
    return resp.value;
  }

  async getOrientation(extra = {}) {
    const request = new GetOrientationRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getOrientation(request);

    const ori = response.orientation;
    if (!ori) {
      throw new Error('no orientation');
    }

    return ori;
  }

  async getPosition(extra = {}) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getPosition(request);
  }

  async getProperties(extra = {}) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request);
  }

  async getAccuracy(extra = {}) {
    const request = new GetAccuracyRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getAccuracy(request);
  }

  async getLinearAcceleration(extra = {}) {
    const request = new GetLinearAccelerationRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getLinearAcceleration(request);

    const acc = response.linearAcceleration;
    if (!acc) {
      throw new Error('no linear acceleration');
    }

    return acc;
  }

  async getReadings(extra = {}) {
    const request = new GetReadingsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getReadings(request);

    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(response.readings)) {
      const value = response.readings[key];
      if (!value) {
        continue;
      }
      result[key] = value.toJson();
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
