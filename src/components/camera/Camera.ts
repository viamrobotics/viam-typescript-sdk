import type {
  DistortionParameters,
  IntrinsicParameters
} from '../../gen/component/camera/v1/camera_pb.esm'

export interface Properties {
  supportsPcd: boolean;
  intrinsicParameters?: IntrinsicParameters.AsObject;
  distortionParameters?: DistortionParameters.AsObject;
}

export enum MimeType {
  VIAM_RGBA = 'image/vnd.viam.rgba',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  PCD = 'pointcloud/pcd',
  UNSUPPORTED = 'unsupported',
}

export interface Camera {
  getImage: (mimeType: MimeType) => Promise<Uint8Array>;
  renderFrame: (mimeType: MimeType) => Promise<Blob>;
  getPointCloud: () => Promise<Uint8Array>;
  getProperties: () => Promise<Properties>;
}
