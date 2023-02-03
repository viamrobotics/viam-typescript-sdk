import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb';
import { Client, baseApi, commonApi } from '../../main';
import type { Base } from './Base';
import { BaseServiceClient } from '../../gen/component/base/v1/base_pb_service.esm';
import type { Options } from '../../types';
import { promisify } from '../../utils';

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
    const request = new baseApi.MoveStraightRequest();
    request.setName(this.name);
    request.setMmPerSec(mmPerSec);
    request.setDistanceMm(distanceMm);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<baseApi.MoveStraightRequest, baseApi.MoveStraightResponse>(
      baseService.moveStraight.bind(baseService),
      request
    );
  }

  async spin(angleDeg: number, degsPerSec: number, extra = {}) {
    const baseService = this.baseService;
    const request = new baseApi.SpinRequest();
    request.setName(this.name);
    request.setAngleDeg(angleDeg);
    request.setDegsPerSec(degsPerSec);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<baseApi.SpinRequest, baseApi.SpinResponse>(
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
    const request = new baseApi.SetPowerRequest();
    request.setName(this.name);
    request.setLinear(linear);
    request.setAngular(angular);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<baseApi.SetPowerRequest, baseApi.SetPowerResponse>(
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
    const request = new baseApi.SetVelocityRequest();
    request.setName(this.name);
    request.setLinear(linear);
    request.setAngular(angular);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<baseApi.SetVelocityRequest, baseApi.SetVelocityResponse>(
      baseService.setVelocity.bind(baseService),
      request
    );
  }

  async stop(extra = {}) {
    const baseService = this.baseService;
    const request = new baseApi.StopRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<baseApi.StopRequest, baseApi.StopResponse>(
      baseService.stop.bind(baseService),
      request
    );
  }
}
