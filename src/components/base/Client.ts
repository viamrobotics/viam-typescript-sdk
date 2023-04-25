import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

import type { RobotClient } from '../../robot';
import pb from '../../gen/component/base/v1/base_pb';
import type { Base } from './Base';
import { BaseServiceClient } from '../../gen/component/base/v1/base_pb_service';
import type { Options, Vector3 } from '../../types';
import { promisify, encodeVector3 } from '../../utils';

/**
 * A gRPC-web client for the Base component.
 *
 * @group Clients
 */
export class BaseClient implements Base {
  private client: BaseServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(BaseServiceClient);
    this.name = name;
    this.options = options;
  }

  private get baseService() {
    return this.client;
  }

  async moveStraight(distanceMm: number, mmPerSec: number, extra = {}) {
    const baseService = this.baseService;
    const request = new pb.MoveStraightRequest();
    request.setName(this.name);
    request.setMmPerSec(mmPerSec);
    request.setDistanceMm(distanceMm);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.MoveStraightRequest, pb.MoveStraightResponse>(
      baseService.moveStraight.bind(baseService),
      request
    );
  }

  async spin(angleDeg: number, degsPerSec: number, extra = {}) {
    const baseService = this.baseService;
    const request = new pb.SpinRequest();
    request.setName(this.name);
    request.setAngleDeg(angleDeg);
    request.setDegsPerSec(degsPerSec);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SpinRequest, pb.SpinResponse>(
      baseService.spin.bind(baseService),
      request
    );
  }

  async setPower(linear: Vector3, angular: Vector3, extra = {}) {
    const baseService = this.baseService;
    const request = new pb.SetPowerRequest();
    request.setName(this.name);
    request.setLinear(encodeVector3(linear));
    request.setAngular(encodeVector3(angular));
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetPowerRequest, pb.SetPowerResponse>(
      baseService.setPower.bind(baseService),
      request
    );
  }

  async setVelocity(linear: Vector3, angular: Vector3, extra = {}) {
    const baseService = this.baseService;
    const request = new pb.SetVelocityRequest();
    request.setName(this.name);
    request.setLinear(encodeVector3(linear));
    request.setAngular(encodeVector3(angular));
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetVelocityRequest, pb.SetVelocityResponse>(
      baseService.setVelocity.bind(baseService),
      request
    );
  }

  async stop(extra = {}) {
    const baseService = this.baseService;
    const request = new pb.StopRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.StopRequest, pb.StopResponse>(
      baseService.stop.bind(baseService),
      request
    );
  }

  async isMoving() {
    const baseService = this.baseService;
    const request = new pb.IsMovingRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<pb.IsMovingRequest, pb.IsMovingResponse>(
      baseService.isMoving.bind(baseService),
      request
    );
    return response.getIsMoving();
  }
}
