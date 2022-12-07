import { type Camera, MimeType, Properties } from './Camera'
import type Client from '../../Client'
import cameraApi from '../../gen/component/camera/v1/camera_pb.esm'
import { grpc } from '@improbable-eng/grpc-web'

export class CameraClient implements Camera {
  private client: Client | undefined
  private readonly name: string

  // TODO: update interface parameters
  constructor (client: Client, name: string) {
    // , serviceHost: string, options?: grpc.RpcOptions) {
    this.client = client
    this.name = name
  }

  getImage (mimeType: MimeType): Promise<Uint8Array> {
    const request = new cameraApi.GetImageRequest()
    request.setName(this.name)
    request.setMimeType(mimeType)

    return new Promise((resolve, reject) => {
      if (!this.client) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.client.cameraService.getImage(
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
      if (!this.client) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.client.cameraService.renderFrame(
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

  getPointCloud (): Promise<Uint8Array> {
    const request = new cameraApi.GetPointCloudRequest()
    request.setName(this.name)
    request.setMimeType(MimeType.PCD)

    return new Promise((resolve, reject) => {
      if (!this.client) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.client.cameraService.getPointCloud(
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
      if (!this.client) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.client.cameraService.getProperties(
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
