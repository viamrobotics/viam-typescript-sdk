import { type Camera, MimeType } from './Camera'
import { CameraServiceClient } from '../../gen/component/camera/v1/camera_pb_service.esm'
import cameraApi from '../../gen/component/camera/v1/camera_pb.esm'
import { grpc } from '@improbable-eng/grpc-web'

export class CameraClient implements Camera {
  private client: CameraServiceClient | undefined

  // TODO: update interface parameters
  constructor (serviceHost: string, options?: grpc.RpcOptions) {
    this.client = new CameraServiceClient(serviceHost, options)
  }

  renderFrame (name: string, mimeType: MimeType): Promise<Blob> {
    const request = new cameraApi.GetPointCloudRequest()
    request.setName(name)
    request.setMimeType(mimeType)

    return new Promise((resolve, reject) => {
      if (!this.client) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.client.renderFrame(
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

  getPointCloud (name: string): Promise<Uint8Array> {
    const request = new cameraApi.GetPointCloudRequest()
    request.setName(name)
    request.setMimeType(MimeType.PCD)

    return new Promise((resolve, reject) => {
      if (!this.client) {
        // TODO: improve error message?
        reject(new Error('not connected yet'))
        return
      }

      this.client.getPointCloud(
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
}
