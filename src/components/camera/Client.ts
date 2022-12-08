import { type Camera, MimeType, Properties } from './Camera'
import {
  CameraServiceClient,
  type ServiceError
} from '../../gen/component/camera/v1/camera_pb_service.esm'
import type Client from '../../Client'
import cameraApi from '../../gen/component/camera/v1/camera_pb.esm'
import { grpc } from '@improbable-eng/grpc-web'

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
        // TODO: improve error message?
        return reject(new Error('no response'))
      }
      return resolve(response)
    })
  })
}

export class CameraClient implements Camera {
  private client: Client | undefined
  private readonly name: string

  // TODO: update interface parameters
  constructor (client: Client, name: string) {
    this.client = client
    this.name = name
  }

  private get cameraService () {
    if (!this.client) {
      return undefined
    }
    const { grpcOptions, serviceHost } = this.client.serviceConnection
    return new CameraServiceClient(serviceHost, grpcOptions)
  }

  getImage (mimeType: MimeType): Promise<Uint8Array> {
    const request = new cameraApi.GetImageRequest()
    request.setName(this.name)
    request.setMimeType(mimeType)

    return new Promise((resolve, reject) => {
      if (!this.cameraService) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.cameraService.getImage(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
            // TODO: improve error message?
            return reject(new Error('no response'))
          }
          const bytes = response.getImage_asU8()
          return resolve(bytes)
        }
      )
    })
  }

  renderFrame (mimeType: MimeType): Promise<Blob> {
    const request = new cameraApi.GetPointCloudRequest()
    request.setName(this.name)
    request.setMimeType(mimeType)

    return new Promise((resolve, reject) => {
      if (!this.cameraService) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.cameraService.renderFrame(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
            // TODO: improve error message?
            return reject(new Error('no response'))
          }
          const bytes = response.getData_asU8()
          return resolve(new Blob([bytes], { type: mimeType }))
        }
      )
    })
  }

  async getPointCloud (): Promise<Uint8Array> {
    if (!this.cameraService) {
      // TODO: improve error message?
      throw new Error('not connected yet')
    }

    const request = new cameraApi.GetPointCloudRequest()
    request.setName(this.name)
    request.setMimeType(MimeType.PCD)

    const response = await promisify<
      cameraApi.GetPointCloudRequest,
      cameraApi.GetPointCloudResponse
    >(this.cameraService.getPointCloud, request)
    return response.getPointCloud_asU8()
  }

  getProperties (): Promise<Properties> {
    const request = new cameraApi.GetPropertiesRequest()
    request.setName(this.name)

    return new Promise((resolve, reject) => {
      if (!this.cameraService) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.cameraService.getProperties(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
            // TODO: improve error message?
            return reject(new Error('no response'))
          }
          return resolve(response.toObject())
        }
      )
    })
  }
}
