import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import pb from '../../gen/component/arm/v1/arm_pb';
import { ArmServiceClient } from '../../gen/component/arm/v1/arm_pb_service';
import type { Options, Pose, StructType } from '../../types';
import { doCommandFromClient, encodePose, promisify } from '../../utils';
import type { Arm } from './arm';

/**
 * A gRPC-web client for the Arm component.
 *
 * @group Clients
 */
export class ArmClient implements Arm {
  private client: ArmServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(ArmServiceClient);
    this.name = name;
    this.options = options;
  }

  private get ArmService() {
    return this.client;
  }

  async getEndPosition(extra = {}) {
    const armService = this.ArmService;
    const request = new pb.GetEndPositionRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetEndPositionRequest,
      pb.GetEndPositionResponse
    >(armService.getEndPosition.bind(armService), request);

    const result = response.getPose();
    if (!result) {
      throw new Error('no pose');
    }
    return result.toObject();
  }

  async moveToPosition(pose: Pose, extra = {}) {
    const armService = this.ArmService;

    const request = new pb.MoveToPositionRequest();
    request.setName(this.name);
    request.setTo(encodePose(pose));
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.MoveToPositionRequest, pb.MoveToPositionResponse>(
      armService.moveToPosition.bind(armService),
      request
    );
  }

  async moveToJointPositions(jointPositionsList: number[], extra = {}) {
    const armService = this.ArmService;

    const newJointPositions = new pb.JointPositions();
    newJointPositions.setValuesList(jointPositionsList);

    const request = new pb.MoveToJointPositionsRequest();
    request.setName(this.name);
    request.setPositions(newJointPositions);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<
      pb.MoveToJointPositionsRequest,
      pb.MoveToJointPositionsResponse
    >(armService.moveToJointPositions.bind(armService), request);
  }

  async getJointPositions(extra = {}) {
    const armService = this.ArmService;
    const request = new pb.GetJointPositionsRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetJointPositionsRequest,
      pb.GetJointPositionsResponse
    >(armService.getJointPositions.bind(armService), request);

    const result = response.getPositions();

    if (!result) {
      throw new Error('no pose');
    }
    return result;
  }

  async stop(extra = {}) {
    const armService = this.ArmService;
    const request = new pb.StopRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.StopRequest, pb.StopResponse>(
      armService.stop.bind(armService),
      request
    );
  }

  async isMoving() {
    const armService = this.ArmService;
    const request = new pb.IsMovingRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<pb.IsMovingRequest, pb.IsMovingResponse>(
      armService.isMoving.bind(armService),
      request
    );
    return response.getIsMoving();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const armService = this.ArmService;
    return doCommandFromClient(armService, this.name, command, this.options);
  }
}
