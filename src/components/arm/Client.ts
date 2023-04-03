import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import pb from '../../gen/component/arm/v1/arm_pb';
import { ArmServiceClient } from '../../gen/component/arm/v1/arm_pb_service';
import type { Options, Pose } from '../../types';
import { promisify } from '../../utils';
import type { Arm } from './Arm';
import commonPB from '../../gen/common/v1/common_pb';

/** A gRPC-web client for the Arm component. */
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
    return {
      x: result.getX(),
      y: result.getY(),
      z: result.getZ(),
      ox: result.getOX(),
      oy: result.getOY(),
      oz: result.getOZ(),
      theta: result.getTheta(),
    };
  }

  async moveToPosition(pose: Pose, world?: commonPB.WorldState, extra = {}) {
    const armService = this.ArmService;

    const pbPose = new commonPB.Pose();
    pbPose.setX(pose.x);
    pbPose.setY(pose.y);
    pbPose.setZ(pose.z);
    pbPose.setOX(pose.ox);
    pbPose.setOY(pose.oy);
    pbPose.setOZ(pose.oz);
    pbPose.setTheta(pose.theta);

    const request = new pb.MoveToPositionRequest();
    request.setName(this.name);
    request.setTo(pbPose);
    request.setWorldState(world);
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
      armService.getJointPositions.bind(armService),
      request
    );
  }

  async isMoving() {
    const armService = this.ArmService;
    const request = new pb.IsMovingRequest();

    this.options.requestLogger?.(request);

    const response = await promisify<pb.IsMovingRequest, pb.IsMovingResponse>(
      armService.isMoving.bind(armService),
      request
    );
    return response.getIsMoving();
  }
}
