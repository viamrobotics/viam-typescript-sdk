import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import pb from '../../gen/service/vision/v1/vision_pb';
import { VisionServiceClient } from '../../gen/service/vision/v1/vision_pb_service';
import type { MimeType } from '../../main';
import type { RobotClient } from '../../robot';
import type { Options, StructType } from '../../types';
import { doCommandFromClient, promisify } from '../../utils';
import type { Vision } from './vision';

/**
 * A gRPC-web client for a Vision service.
 *
 * @group Clients
 */
export class VisionClient implements Vision {
  private client: VisionServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(VisionServiceClient);
    this.name = name;
    this.options = options;
  }

  private get service() {
    return this.client;
  }

  async getDetectionsFromCamera(cameraName: string, extra: StructType = {}) {
    const { service } = this;

    const request = new pb.GetDetectionsFromCameraRequest();
    request.setName(this.name);
    request.setCameraName(cameraName);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetDetectionsFromCameraRequest,
      pb.GetDetectionsFromCameraResponse
    >(service.getDetectionsFromCamera.bind(service), request);

    return response.getDetectionsList().map((x) => x.toObject());
  }

  async getDetections(
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    extra: StructType = {}
  ) {
    const { service } = this;

    const request = new pb.GetDetectionsRequest();
    request.setName(this.name);
    request.setImage(image);
    request.setWidth(width);
    request.setHeight(height);
    request.setMimeType(mimeType);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetDetectionsRequest,
      pb.GetDetectionsResponse
    >(service.getDetections.bind(service), request);

    return response.getDetectionsList().map((x) => x.toObject());
  }

  async getClassificationsFromCamera(
    cameraName: string,
    count: number,
    extra: StructType = {}
  ) {
    const { service } = this;

    const request = new pb.GetClassificationsFromCameraRequest();
    request.setName(this.name);
    request.setCameraName(cameraName);
    request.setN(count);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetClassificationsFromCameraRequest,
      pb.GetClassificationsFromCameraResponse
    >(service.getClassificationsFromCamera.bind(service), request);

    return response.getClassificationsList().map((x) => x.toObject());
  }

  async getClassifications(
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    count: number,
    extra: StructType = {}
  ) {
    const { service } = this;

    const request = new pb.GetClassificationsRequest();
    request.setName(this.name);
    request.setImage(image);
    request.setWidth(width);
    request.setHeight(height);
    request.setMimeType(mimeType);
    request.setN(count);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetClassificationsRequest,
      pb.GetClassificationsResponse
    >(service.getClassifications.bind(service), request);

    return response.getClassificationsList().map((x) => x.toObject());
  }

  async getObjectPointClouds(cameraName: string, extra: StructType = {}) {
    const { service } = this;

    const request = new pb.GetObjectPointCloudsRequest();
    request.setName(this.name);
    request.setCameraName(cameraName);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetObjectPointCloudsRequest,
      pb.GetObjectPointCloudsResponse
    >(service.getObjectPointClouds.bind(service), request);

    return response.getObjectsList().map((x) => x.toObject());
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { service } = this;
    return doCommandFromClient(service, this.name, command, this.options);
  }
}
