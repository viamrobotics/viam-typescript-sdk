import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  CaptureAllFromCameraRequestSchema,
  GetClassificationsFromCameraRequestSchema,
  GetClassificationsRequestSchema,
  GetDetectionsFromCameraRequestSchema,
  GetDetectionsRequestSchema,
  GetObjectPointCloudsRequestSchema,
  GetPropertiesRequestSchema,
  VisionService,
} from "../../gen/service/vision/v1/vision_pb";
import type { MimeType } from "../../main";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { CaptureAllOptions } from "./types";
import type { Vision } from "./vision";

/**
 * A gRPC-web client for a Vision service.
 *
 * @group Clients
 */
export class VisionClient implements Vision {
  private client: Client<typeof VisionService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(VisionService);
    this.name = name;
    this.options = options;
  }

  async getDetectionsFromCamera(
    cameraName: string,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetDetectionsFromCameraRequestSchema, {
      name: this.name,
      cameraName,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getDetectionsFromCamera(
      request,
      callOptions,
    );
    return resp.detections;
  }

  async getDetections(
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetDetectionsRequestSchema, {
      name: this.name,
      image,
      width: width ? BigInt(width) : undefined,
      height: height ? BigInt(height) : undefined,
      mimeType,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getDetections(request, callOptions);
    return resp.detections;
  }

  async getClassificationsFromCamera(
    cameraName: string,
    count: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetClassificationsFromCameraRequestSchema, {
      name: this.name,
      cameraName,
      n: count, // eslint-disable-line id-length
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getClassificationsFromCamera(
      request,
      callOptions,
    );
    return resp.classifications;
  }

  async getClassifications(
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    count: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetClassificationsRequestSchema, {
      name: this.name,
      image,
      width,
      height,
      mimeType,
      n: count, // eslint-disable-line id-length
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getClassifications(request, callOptions);
    return resp.classifications;
  }

  async getObjectPointClouds(
    cameraName: string,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetObjectPointCloudsRequestSchema, {
      name: this.name,
      cameraName,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getObjectPointClouds(request, callOptions);
    return resp.objects;
  }

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPropertiesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getProperties(request, callOptions);
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
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(CaptureAllFromCameraRequestSchema, {
      name: this.name,
      cameraName,
      returnImage,
      returnClassifications,
      returnDetections,
      returnObjectPointClouds,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.captureAllFromCamera(
      request,
      callOptions,
    );

    return {
      image: response.image,
      classifications: response.classifications,
      detections: response.detections,
      objectPointClouds: response.objects,
      extra: response.extra,
    };
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions,
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions,
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
