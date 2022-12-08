import { type Camera, MimeType, Properties } from './Camera'
import {
  CameraServiceClient,
  type ServiceError
} from '../../gen/component/camera/v1/camera_pb_service.esm'
import type Client from '../../Client'
import type { HttpBody } from '../../gen/google/api/httpbody_pb'
import { grpc } from '@improbable-eng/grpc-web'
import pb from '../../gen/component/camera/v1/camera_pb.esm'

type Callback<T> = (error: ServiceError | null, response: T | null) => void;

type ServiceFunc<Req, Resp> = (
  request: Req,
  metadata: grpc.Metadata,
  callback: Callback<Resp>
) => void;

const promisify = function <Req, Resp> (
  func: ServiceFunc<Req, Resp>,
  request: Req
): Promise<Resp> {
  return new Promise((resolve, reject) => {
    func(request, new grpc.Metadata(), (error, response) => {
      if (error) {
        return reject(error)
      }
      if (!response) {
        return reject(new Error('no response'))
      }
      return resolve(response)
    })
  })
}

export class CameraClient implements Camera {
  private client: Client | undefined
  private readonly name: string

  constructor (client: Client, name: string) {
    this.client = client
    this.name = name
  }

  private get cameraService () {
    if (!this.client) {
      throw new Error('not connected yet')
    }
    const { grpcOptions, serviceHost } = this.client.serviceConnection
    return new CameraServiceClient(serviceHost, grpcOptions)
  }

  async getImage (mimeType: MimeType): Promise<Uint8Array> {
    const cameraService = this.cameraService
    const request = new pb.GetImageRequest()
    request.setName(this.name)
    request.setMimeType(mimeType)

    const response = await promisify<pb.GetImageRequest, pb.GetImageResponse>(
      cameraService.getImage.bind(cameraService),
      request
    )

    return response.getImage_asU8()
  }

  async renderFrame (mimeType: MimeType): Promise<Blob> {
    const cameraService = this.cameraService
    const request = new pb.GetPointCloudRequest()
    request.setName(this.name)
    request.setMimeType(mimeType)

    const response = await promisify<pb.RenderFrameRequest, HttpBody>(
      cameraService.renderFrame.bind(cameraService),
      request
    )

    return new Blob([response.getData_asU8()], { type: mimeType })
  }

  async getPointCloud (): Promise<Uint8Array> {
    const cameraService = this.cameraService
    const request = new pb.GetPointCloudRequest()
    request.setName(this.name)
    request.setMimeType(MimeType.PCD)

    const response = await promisify<
      pb.GetPointCloudRequest,
      pb.GetPointCloudResponse
    >(cameraService.getPointCloud.bind(cameraService), request)

    return response.getPointCloud_asU8()
  }

  async getProperties (): Promise<Properties> {
    const cameraService = this.cameraService
    const request = new pb.GetPropertiesRequest()
    request.setName(this.name)

    const response = await promisify<
      pb.GetPropertiesRequest,
      pb.GetPropertiesResponse
    >(cameraService.getProperties.bind(cameraService), request)

    return response.toObject()
  }
}
