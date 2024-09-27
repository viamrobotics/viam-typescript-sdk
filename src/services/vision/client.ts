import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { VisionService } from '../../gen/service/vision/v1/vision_connect';
import {
  CaptureAllFromCameraRequest,
  GetClassificationsFromCameraRequest,
  GetClassificationsRequest,
  GetDetectionsFromCameraRequest,
  GetDetectionsRequest,
  GetObjectPointCloudsRequest,
  GetPropertiesRequest,
} from '../../gen/service/vision/v1/vision_pb';
import type { MimeType } from '../../main';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { CaptureAllOptions } from './types';
import type { Vision } from './vision';

/**
 * A gRPC-web client for a Vision service.
 *
 * @group Clients
 */
export class VisionClient implements Vision {
  private client: PromiseClient<typeof VisionService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(VisionService);
    this.name = name;
    this.options = options;
  }

  async getDetectionsFromCamera(cameraName: string, extra = {}) {
    const request = new GetDetectionsFromCameraRequest({
      name: this.name,
      cameraName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getDetectionsFromCamera(request);
    return resp.detections;
  }

  async getDetections(
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    extra = {}
  ) {
    const request = new GetDetectionsRequest({
      name: this.name,
      image,
      width: width ? BigInt(width) : undefined,
      height: height ? BigInt(height) : undefined,
      mimeType,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getDetections(request);
    return resp.detections;
  }

  async getClassificationsFromCamera(
    cameraName: string,
    count: number,
    extra = {}
  ) {
    const request = new GetClassificationsFromCameraRequest({
      name: this.name,
      cameraName,
      n: count, // eslint-disable-line id-length
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getClassificationsFromCamera(request);
    return resp.classifications;
  }

  async getClassifications(
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    count: number,
    extra = {}
  ) {
    const request = new GetClassificationsRequest({
      name: this.name,
      image,
      width,
      height,
      mimeType,
      n: count, // eslint-disable-line id-length
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getClassifications(request);
    return resp.classifications;
  }

  async getObjectPointClouds(cameraName: string, extra = {}) {
    const request = new GetObjectPointCloudsRequest({
      name: this.name,
      cameraName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getObjectPointClouds(request);
    return resp.objects;
  }

  async getProperties(extra = {}) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getProperties(request);
    return {
      classificationsSupported: response.classificationsSupported,
      detectionsSupported: response.detectionsSupported,
      objectPointCloudsSupported: response.objectPointCloudsSupported,
    };
  }

  async captureAllFromCamera(
    cameraName: string,
    {
      returnImage,
      returnClassifications,
      returnDetections,
      returnObjectPointClouds,
    }: CaptureAllOptions,
    extra = {}
  ) {
    const request = new CaptureAllFromCameraRequest({
      name: this.name,
      cameraName,
      returnImage,
      returnClassifications,
      returnDetections,
      returnObjectPointClouds,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.captureAllFromCamera(request);

    return {
      image: response.image,
      classifications: response.classifications,
      detections: response.detections,
      objectPointClouds: response.objects,
    };
  }

  async doCommand(command: Struct): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options
    );
  }
}
