import { type JsonValue, Struct, Timestamp } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { GetPropertiesRequest } from '../../gen/component/base/v1/base_pb';
import { CameraService } from '../../gen/component/camera/v1/camera_connect';
import {
  GetImagesRequest,
  GetPointCloudRequest,
} from '../../gen/component/camera/v1/camera_pb';
import type { RobotClient } from '../../robot';
import type { Options, StructInput } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Camera, MimeType, ResponseMetadata } from './camera';
import { GetGeometriesRequest } from '../../gen/common/v1/common_pb';

const PointCloudPCD: MimeType = 'pointcloud/pcd';

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
    const request = new GetGeometriesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    const response = await this.client.getGeometries(request, callOptions);
    return response.geometries;
  }

  async getImages(
    filterSourceNames: string[] = [],
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GetImagesRequest({
      name: this.name,
      filterSourceNames,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getImages(request, callOptions);
    const images = resp.images.map((image) => ({
      sourceName: image.sourceName,
      image: image.image,
      mimeType: image.mimeType,
    }));
    const metadata: ResponseMetadata = {
      capturedAt: resp.responseMetadata?.capturedAt ?? new Timestamp(),
    };

    return { images, metadata };
  }

  async getPointCloud(extra = {}, callOptions = this.callOptions) {
    const request = new GetPointCloudRequest({
      name: this.name,
      mimeType: PointCloudPCD,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPointCloud(request, callOptions);
    return resp.pointCloud;
  }

  async getProperties(callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
  }

  async doCommand(
    command: StructInput,
    callOptions = this.callOptions
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}
