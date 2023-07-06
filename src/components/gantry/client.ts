import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import pb from '../../gen/component/gantry/v1/gantry_pb';
import { GantryServiceClient } from '../../gen/component/gantry/v1/gantry_pb_service';
import type { Options, StructType } from '../../types';
import { doCommandFromClient, promisify } from '../../utils';
import type { Gantry } from './gantry';

/**
 * A gRPC-web client for the Gantry component.
 *
 * @group Clients
 */
export class GantryClient implements Gantry {
  private client: GantryServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GantryServiceClient);
    this.name = name;
    this.options = options;
  }

  private get GantryService() {
    return this.client;
  }

  async getPosition(extra = {}) {
    const gantryService = this.GantryService;
    const request = new pb.GetPositionRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPositionRequest,
      pb.GetPositionResponse
    >(gantryService.getPosition.bind(gantryService), request);

    const result = response.getPositionsMmList();
    if (!result) {
      throw new Error('no positions');
    }
    return result;
  }

  async moveToPosition(
    positionsMm: number[],
    speedsMmPerSec: number[],
    extra = {}
  ) {
    const gantryService = this.GantryService;

    const request = new pb.MoveToPositionRequest();
    request.setName(this.name);
    request.setPositionsMmList(positionsMm);
    request.setSpeedsMmPerSecList(speedsMmPerSec);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.MoveToPositionRequest, pb.MoveToPositionResponse>(
      gantryService.moveToPosition.bind(gantryService),
      request
    );
  }

  async home(extra = {}) {
    const gantryService = this.GantryService;
    const request = new pb.HomeRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.HomeRequest, pb.HomeResponse>(
      gantryService.home.bind(gantryService),
      request
    );

    const result = response.getHomed();

    if (!result) {
      throw new Error('not homed');
    }
    return result;
  }

  async getLengths(extra = {}) {
    const gantryService = this.GantryService;
    const request = new pb.GetLengthsRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetLengthsRequest,
      pb.GetLengthsResponse
    >(gantryService.getLengths.bind(gantryService), request);

    const result = response.getLengthsMmList();

    if (!result) {
      throw new Error('no lengths');
    }
    return result;
  }

  async stop(extra = {}) {
    const gantryService = this.GantryService;
    const request = new pb.StopRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.StopRequest, pb.StopResponse>(
      gantryService.stop.bind(gantryService),
      request
    );
  }

  async isMoving() {
    const gantryService = this.GantryService;
    const request = new pb.IsMovingRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<pb.IsMovingRequest, pb.IsMovingResponse>(
      gantryService.isMoving.bind(gantryService),
      request
    );
    return response.getIsMoving();
  }

  async doCommand(command: StructType): Promise<StructType> {
    const gantryService = this.GantryService;
    return doCommandFromClient(gantryService, this.name, command, this.options);
  }
}
