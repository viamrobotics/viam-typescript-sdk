import type {
  DistortionParameters,
  IntrinsicParameters,
} from '../../gen/component/camera/v1/camera_pb.esm';

export interface Properties {
  /** Whether the camera supports the return of point cloud data. */
  supportsPcd: boolean;
  /** Camera intrinsic parameters, if available. */
  intrinsicParameters?: IntrinsicParameters.AsObject;
  /** Camera distortion parameters, if available. */
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
  /**
   * Return a frame from a camera.
   *
   * @param mimeType - A specific MIME type to request. This is not necessarily
   *   the same type that will be returned.
   */
  getImage: (mimeType: MimeType) => Promise<Uint8Array>;

  /**
   * Render a frame from a camera to an HTTP response.
   *
   * @param mimeType - A specific MIME type to request. This is not necessarily
   *   the same type that will be returned.
   */
  renderFrame: (mimeType: MimeType) => Promise<Blob>;

  /** Return a point cloud from a camera. */
  getPointCloud: () => Promise<Uint8Array>;

  /** Return the camera properties. */
  getProperties: () => Promise<Properties>;
}
