import { create } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import type { CallOptions, Client } from "@connectrpc/connect";
import { GetGeometriesRequestSchema } from "../../gen/common/v1/common_pb";
import {
  CameraService,
  GetImagesRequestSchema,
  GetPointCloudRequestSchema,
  GetPropertiesRequestSchema,
} from "../../gen/component/camera/v1/camera_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { Camera, MimeType, ResponseMetadata } from "./camera";

const PointCloudPCD: MimeType = "pointcloud/pcd";

/**
 * A gRPC-web client for the Camera component.
 *
 * @group Clients
 */
export class CameraClient implements Camera {
  private client: Client<typeof CameraService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(CameraService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    const request = create(GetGeometriesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    const response = await this.client.getGeometries(request, callOptions);
    return response.geometries;
  }

  async getImages(
    filterSourceNames: string[] = [],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetImagesRequestSchema, {
      name: this.name,
      filterSourceNames,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getImages(request, callOptions);
    const images = resp.images.map((image) => ({
      sourceName: image.sourceName,
      image: image.image,
      mimeType: image.mimeType,
    }));
    const metadata: ResponseMetadata = {
      capturedAt: resp.responseMetadata?.capturedAt ?? create(TimestampSchema),
    };

    return { images, metadata };
  }

  async getPointCloud(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPointCloudRequestSchema, {
      name: this.name,
      mimeType: PointCloudPCD,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPointCloud(request, callOptions);
    return resp.pointCloud;
  }

  async getProperties(callOptions = this.callOptions) {
    const request = create(GetPropertiesRequestSchema, {
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
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
