import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { GetPropertiesRequest } from '../../gen/component/base/v1/base_pb';
import { CameraService } from '../../gen/component/camera/v1/camera_connect';
import {
  GetImageRequest,
  GetPointCloudRequest,
  RenderFrameRequest,
} from '../../gen/component/camera/v1/camera_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Camera, MimeType } from './camera';

const PointCloudPCD: MimeType = 'pointcloud/pcd';

/**
 * A gRPC-web client for the Camera component.
 *
 * @group Clients
 */
export class CameraClient implements Camera {
  private client: PromiseClient<typeof CameraService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(CameraService);
    this.name = name;
    this.options = options;
  }

  async getImage(mimeType: MimeType = '') {
    const request = new GetImageRequest({
      name: this.name,
      mimeType,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getImage(request);
    return resp.image;
  }

  async renderFrame(mimeType: MimeType = '') {
    const request = new RenderFrameRequest({
      name: this.name,
      mimeType,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.renderFrame(request);
    return new Blob([resp.data], { type: mimeType });
  }

  async getPointCloud() {
    const request = new GetPointCloudRequest({
      name: this.name,
      mimeType: PointCloudPCD,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPointCloud(request);
    return resp.pointCloud;
  }

  async getProperties() {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request);
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
