import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { RobotClient } from '../../robot';
import type { Encoder } from './Encoder';
import { EncoderServiceClient } from '../../gen/component/encoder/v1/encoder_pb_service';
import { type Options, PositionType } from '../../types';
import encoderApi from '../../gen/component/encoder/v1/encoder_pb';
import { promisify } from '../../utils';

/**
 * A gRPC-web client for the Encoder component.
 *
 * @group Clients
 */
export class EncoderClient implements Encoder {
  private client: EncoderServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(EncoderServiceClient);
    this.name = name;
    this.options = options;
  }

  private get encoderService() {
    return this.client;
  }

  async resetPosition(extra = {}) {
    const encoderService = this.encoderService;
    const request = new encoderApi.ResetPositionRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<
      encoderApi.ResetPositionRequest,
      encoderApi.ResetPositionResponse
    >(encoderService.resetPosition.bind(encoderService), request);
  }

  async getProperties(extra = {}) {
    const encoderService = this.encoderService;
    const request = new encoderApi.GetPropertiesRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      encoderApi.GetPropertiesRequest,
      encoderApi.GetPropertiesResponse
    >(encoderService.getProperties.bind(encoderService), request);
    return {
      ticksCountSupported: response.getTicksCountSupported(),
      angleDegreesSupported: response.getAngleDegreesSupported(),
    };
  }

  async getPosition(positionType?: PositionType, extra = {}) {
    const encoderService = this.encoderService;
    const request = new encoderApi.GetPositionRequest();
    request.setName(this.name);
    if (positionType === undefined) {
      request.setPositionType(PositionType.POSITION_TYPE_UNSPECIFIED);
    } else {
      request.setPositionType(positionType);
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      encoderApi.GetPositionRequest,
      encoderApi.GetPositionResponse
    >(encoderService.getPosition.bind(encoderService), request);
    return [response.getValue(), response.getPositionType()] as const;
  }
}
