import type { Struct } from '@bufbuild/protobuf';
import type {
  DistortionParameters,
  IntrinsicParameters,
} from '../../gen/component/camera/v1/camera_pb';
import type { Resource } from '../../types';
import type { Geometry } from '../../gen/common/v1/common_pb';

export interface Properties {
  /** Whether the camera supports the return of point cloud data. */
  supportsPcd: boolean;
  /** Camera intrinsic parameters, if available. */
  intrinsicParameters?: IntrinsicParameters;
  /** Camera distortion parameters, if available. */
  distortionParameters?: DistortionParameters;
  /** Camera frame rate parameters, if available. */
  frameRate?: number;
}

export type MimeType =
  | ''
  | 'image/vnd.viam.rgba'
  | 'image/jpeg'
  | 'image/png'
  | 'pointcloud/pcd'
  | 'unsupported';

/** Represents any physical hardware that can capture frames. */
export interface Camera extends Resource {
  /** Get the geometries of the component in their current configuration */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Return a frame from a camera.
   *
   * @param mimeType - A specific MIME type to request. This is not necessarily
   *   the same type that will be returned.
   */
  getImage: (mimeType?: MimeType, extra?: Struct) => Promise<Uint8Array>;

  /**
   * Render a frame from a camera to an HTTP response.
   *
   * @param mimeType - A specific MIME type to request. This is not necessarily
   *   the same type that will be returned.
   */
  renderFrame: (mimeType?: MimeType, extra?: Struct) => Promise<Blob>;

  /** Return a point cloud from a camera. */
  getPointCloud: (extra?: Struct) => Promise<Uint8Array>;

  /** Return the camera properties. */
  getProperties: () => Promise<Properties>;
}
