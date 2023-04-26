import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import { MotorServiceClient } from '../../gen/component/motor/v1/motor_pb_service';
import type { Options } from '../../types';
import motorApi from '../../gen/component/motor/v1/motor_pb';
import { promisify } from '../../utils';
import type { Motor } from './Motor';

/**
 * A gRPC-web client for the Motor component.
 *
 * @group Clients
 */
export class MotorClient implements Motor {
  private client: MotorServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotorServiceClient);
    this.name = name;
    this.options = options;
  }

  private get motorService() {
    return this.client;
  }

  async setPower(power: number, extra = {}) {
    const { motorService } = this;
    const request = new motorApi.SetPowerRequest();
    request.setName(this.name);
    request.setPowerPct(power);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<motorApi.SetPowerRequest, motorApi.SetPowerResponse>(
      motorService.setPower.bind(motorService),
      request
    );
  }

  async goFor(rpm: number, revolutions: number, extra = {}) {
    const { motorService } = this;
    const request = new motorApi.GoForRequest();
    request.setName(this.name);
    request.setRpm(rpm);
    request.setRevolutions(revolutions);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<motorApi.GoForRequest, motorApi.GoForResponse>(
      motorService.goFor.bind(motorService),
      request
    );
  }

  async goTo(rpm: number, positionRevolutions: number, extra = {}) {
    const { motorService } = this;
    const request = new motorApi.GoToRequest();
    request.setName(this.name);
    request.setRpm(rpm);
    request.setPositionRevolutions(positionRevolutions);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<motorApi.GoToRequest, motorApi.GoToResponse>(
      motorService.goTo.bind(motorService),
      request
    );
  }

  async resetZeroPosition(offset: number, extra = {}) {
    const { motorService } = this;
    const request = new motorApi.ResetZeroPositionRequest();
    request.setName(this.name);
    request.setOffset(offset);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<
      motorApi.ResetZeroPositionRequest,
      motorApi.ResetZeroPositionResponse
    >(motorService.resetZeroPosition.bind(motorService), request);
  }

  async stop(extra = {}) {
    const { motorService } = this;
    const request = new motorApi.StopRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<motorApi.StopRequest, motorApi.StopResponse>(
      motorService.stop.bind(motorService),
      request
    );
  }

  async getProperties(extra = {}) {
    const { motorService } = this;
    const request = new motorApi.GetPropertiesRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      motorApi.GetPropertiesRequest,
      motorApi.GetPropertiesResponse
    >(motorService.getProperties.bind(motorService), request);
    return { positionReporting: response.getPositionReporting() };
  }

  async getPosition(extra = {}) {
    const { motorService } = this;
    const request = new motorApi.GetPositionRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      motorApi.GetPositionRequest,
      motorApi.GetPositionResponse
    >(motorService.getPosition.bind(motorService), request);
    return response.getPosition();
  }

  async isPowered(extra = {}) {
    const { motorService } = this;
    const request = new motorApi.IsPoweredRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      motorApi.IsPoweredRequest,
      motorApi.IsPoweredResponse
    >(motorService.isPowered.bind(motorService), request);
    return [response.getIsOn(), response.getPowerPct()] as const;
  }

  async isMoving() {
    const motorService = this.motorService;
    const request = new motorApi.IsMovingRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      motorApi.IsMovingRequest,
      motorApi.IsMovingResponse
    >(motorService.isMoving.bind(motorService), request);
    return response.getIsMoving();
  }
}
