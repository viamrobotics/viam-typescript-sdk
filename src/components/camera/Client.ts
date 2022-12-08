import { type Camera, MimeType, Properties } from './Camera'
import { CameraServiceClient } from '../../gen/component/camera/v1/camera_pb_service.esm'
import type Client from '../../Client'
import cameraApi from '../../gen/component/camera/v1/camera_pb.esm'
import { grpc } from '@improbable-eng/grpc-web'

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

  getImage (mimeType: MimeType): Promise<Uint8Array> {
    const request = new cameraApi.GetImageRequest()
    request.setName(this.name)
    request.setMimeType(mimeType)

    return new Promise((resolve, reject) => {
      this.cameraService.getImage(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
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
      this.cameraService.renderFrame(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
            return reject(new Error('no response'))
          }
          const bytes = response.getData_asU8()
          return resolve(new Blob([bytes], { type: mimeType }))
        }
      )
    })
  }

  getPointCloud (): Promise<Uint8Array> {
    const request = new cameraApi.GetPointCloudRequest()
    request.setName(this.name)
    request.setMimeType(MimeType.PCD)

    return new Promise((resolve, reject) => {
      this.cameraService.getPointCloud(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
            return reject(new Error('no response'))
          }
          const result = response.getPointCloud_asU8()
          return resolve(result)
        }
      )
    })
  }

  getProperties (): Promise<Properties> {
    const request = new cameraApi.GetPropertiesRequest()
    request.setName(this.name)

    return new Promise((resolve, reject) => {
      this.cameraService.getProperties(
        request,
        new grpc.Metadata(),
        (error, response) => {
          if (error) {
            return reject(error)
          }
          if (!response) {
            return reject(new Error('no response'))
          }
          return resolve(response.toObject())
        }
      )
    })
  }
}
