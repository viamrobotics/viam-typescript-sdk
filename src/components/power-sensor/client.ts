import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import { PowerSensorServiceClient } from '../../gen/component/powersensor/v1/powersensor_pb_service';
import type { Options, StructType } from '../../types';
import pb from '../../gen/component/powersensor/v1/powersensor_pb';
import { promisify, doCommandFromClient } from '../../utils';
import type { PowerSensor, PowerSensorReadings } from './power-sensor';

/**
 * A gRPC-web client for the MovementSensor component.
 *
 * @group Clients
 */

export class PowerSensorClient implements PowerSensor {
  private client: PowerSensorServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(PowerSensorServiceClient);
    this.name = name;
    this.options = options;
  }

  private get powersensorService() {
    return this.client;
  }

  async getVoltage(extra = {}) {
    const { powersensorService } = this;
    const request = new pb.GetVoltageRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetVoltageRequest,
      pb.GetVoltageResponse
    >(powersensorService.getVoltage.bind(powersensorService), request);

    return [response.getVolts(), response.getIsAc()] as const;
  }

  async getCurrent(extra = {}) {
    const { powersensorService } = this;
    const request = new pb.GetCurrentRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetCurrentRequest,
      pb.GetCurrentResponse
    >(powersensorService.getCurrent.bind(powersensorService), request);

    return [response.getAmperes(), response.getIsAc()] as const;
  }

  async getPower(extra = {}) {
    const { powersensorService } = this;
    const request = new pb.GetPowerRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.GetPowerRequest, pb.GetPowerResponse>(
      powersensorService.getPower.bind(powersensorService),
      request
    );

    return response.getWatts();
  }

  async getReadings(extra = {}) {
    const readings: Record<string, any> = {};
    try {
      const ret = await this.getVoltage(extra);
      readings['voltage'] = ret[0];
      readings['isAc'] = ret[1];
    } catch (error) {
      if (!(error as Error).message.includes('Unimplemented')) {
        throw error;
      }
    }
    try {
      const ret = await this.getCurrent(extra);
      readings['current'] = ret[0];
      readings['isAc'] = ret[1];
    } catch (error) {
      if (!(error as Error).message.includes('Unimplemented')) {
        throw error;
      }
    }
    try {
      readings['power'] = await this.getPower(extra);
    } catch (error) {
      if (!(error as Error).message.includes('Unimplemented')) {
        throw error;
      }
    }
    return readings;
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { powersensorService } = this;
    return doCommandFromClient(
      powersensorService,
      this.name,
      command,
      this.options
    );
  }
}
