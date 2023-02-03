import { type Camera, MimeType } from './Camera';
import { CameraServiceClient } from '../../gen/component/camera/v1/camera_pb_service.esm';
import type Client from '../../Client';
import type { HttpBody } from '../../gen/google/api/httpbody_pb';
import type { Options } from '../../types';
import pb from '../../gen/component/camera/v1/camera_pb.esm';
import { promisify } from '../../utils';

export class CameraClient implements Camera {
  private client: CameraServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: Client, name: string, options: Options = {}) {
    this.client = client.createServiceClient(CameraServiceClient);
    this.name = name;
    this.options = options;
  }

  private get cameraService() {
    return this.client;
  }

  async getImage(mimeType: MimeType) {
    const cameraService = this.cameraService;
    const request = new pb.GetImageRequest();
    request.setName(this.name);
    request.setMimeType(mimeType);

    this.options.requestLogger?.(request);

    const response = await promisify<pb.GetImageRequest, pb.GetImageResponse>(
      cameraService.getImage.bind(cameraService),
      request
    );

    return response.getImage_asU8();
  }

  async renderFrame(mimeType: MimeType) {
    const cameraService = this.cameraService;
    const request = new pb.GetPointCloudRequest();
    request.setName(this.name);
    request.setMimeType(mimeType);

    this.options.requestLogger?.(request);

    const response = await promisify<pb.RenderFrameRequest, HttpBody>(
      cameraService.renderFrame.bind(cameraService),
      request
    );

    return new Blob([response.getData_asU8()], { type: mimeType });
  }

  async getPointCloud() {
    const cameraService = this.cameraService;
    const request = new pb.GetPointCloudRequest();
    request.setName(this.name);
    request.setMimeType(MimeType.PCD);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPointCloudRequest,
      pb.GetPointCloudResponse
    >(cameraService.getPointCloud.bind(cameraService), request);

    return response.getPointCloud_asU8();
  }

  async getProperties() {
    const cameraService = this.cameraService;
    const request = new pb.GetPropertiesRequest();
    request.setName(this.name);

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetPropertiesRequest,
      pb.GetPropertiesResponse
    >(cameraService.getProperties.bind(cameraService), request);

    return response.toObject();
  }
}
