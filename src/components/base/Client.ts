import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb';

import type Client from '../../Client';
import pb from '../../gen/component/base/v1/base_pb.esm';
import type commonApi from '../../gen/common/v1/common_pb.esm';
import type { Base } from './Base';
import { BaseServiceClient } from '../../gen/component/base/v1/base_pb_service.esm';
import type { Options } from '../../types';
import { promisify } from '../../utils';

/** A gRPC client for the Base component. */
export class BaseClient implements Base {
  private client: BaseServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: Client, name: string, options: Options = {}) {
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
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SpinRequest, pb.SpinResponse>(
      baseService.spin.bind(baseService),
      request
    );
  }
  async setPower(
    linear: commonApi.Vector3,
    angular: commonApi.Vector3,
    extra = {}
  ) {
    const baseService = this.baseService;
    const request = new pb.SetPowerRequest();
    request.setName(this.name);
    request.setLinear(linear);
    request.setAngular(angular);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetPowerRequest, pb.SetPowerResponse>(
      baseService.setPower.bind(baseService),
      request
    );
  }

  async setVelocity(
    linear: commonApi.Vector3,
    angular: commonApi.Vector3,
    extra = {}
  ) {
    const baseService = this.baseService;
    const request = new pb.SetVelocityRequest();
    request.setName(this.name);
    request.setLinear(linear);
    request.setAngular(angular);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

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
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.StopRequest, pb.StopResponse>(
      baseService.stop.bind(baseService),
      request
    );
  }
}
