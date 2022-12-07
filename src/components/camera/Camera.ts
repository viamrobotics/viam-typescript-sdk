import type {
  DistortionParameters,
  IntrinsicParameters
} from '../../gen/component/camera/v1/camera_pb.esm'

export interface Properties {
  supportsPcd: boolean;
  intrinsicParameters: IntrinsicParameters.AsObject;
  distortionParameters: DistortionParameters.AsObject;
}

export enum MimeType {
  VIAM_RGBA = 'image/vnd.viam.rgba',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  PCD = 'pointcloud/pcd',
  UNSUPPORTED = 'unsupported',
}

export interface Camera {
  // GetImage: (name: string, mimeType: MimeType) => Promise<Uint8Array | string>;
  renderFrame: (name: string, mimeType: MimeType) => Promise<Blob>;
  getPointCloud: (name: string) => Promise<Uint8Array>;
  // GetProperties: (name: string) => Promise<Properties>;
}
