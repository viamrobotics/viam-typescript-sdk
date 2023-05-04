import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import { ServoServiceClient } from '../../gen/component/servo/v1/servo_pb_service';
import type { Options, StructType } from '../../types';
import pb from '../../gen/component/servo/v1/servo_pb';
import { promisify, doCommandFromClient } from '../../utils';
import type { Servo } from './servo';

/**
 * A gRPC-web client for the Servo component.
 *
 * @group Clients
 */
export class ServoClient implements Servo {
  private client: ServoServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(ServoServiceClient);
    this.name = name;
    this.options = options;
  }

  private get servoService() {
    return this.client;
  }

  async move(angleDeg: number, extra: StructType = {}) {
    const { servoService } = this;
    const request = new pb.MoveRequest();
    request.setName(this.name);
    request.setAngleDeg(angleDeg);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.MoveRequest, pb.MoveResponse>(
      servoService.move.bind(servoService),
      request
    );
  }

  async getPosition(extra: StructType = {}) {
    const { servoService } = this;
    const request = new pb.GetPositionRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPositionRequest,
      pb.GetPositionResponse
    >(servoService.getPosition.bind(servoService), request);

    return response.getPositionDeg();
  }

  async stop(extra = {}) {
    const { servoService } = this;
    const request = new pb.StopRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.StopRequest, pb.StopResponse>(
      servoService.stop.bind(servoService),
      request
    );
  }

  async isMoving() {
    const { servoService } = this;
    const request = new pb.IsMovingRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<pb.IsMovingRequest, pb.IsMovingResponse>(
      servoService.isMoving.bind(servoService),
      request
    );
    return response.getIsMoving();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { servoService } = this;
    return doCommandFromClient(servoService, this.name, command, this.options);
  }
}
