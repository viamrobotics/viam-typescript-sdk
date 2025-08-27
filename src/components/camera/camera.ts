import type { Struct } from '@bufbuild/protobuf';
import type { Timestamp } from '@bufbuild/protobuf';
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

export interface NamedImage {
  sourceName: string;
  image: Uint8Array;
  mimeType: string;
}

export interface ResponseMetadata {
  capturedAt: Timestamp;
}

export type MimeType =
  | ''
  | 'image/vnd.viam.rgba'
  | 'image/vnd.viam.depth'
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
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const image = await camera.getImage();
   *
   * // Convert Uint8Array to base64
   * const base64Image = btoa(
   *   Array.from(image)
   *     .map((byte) => String.fromCharCode(byte))
   *     .join('')
   * );
   *
   * // Convert image to base64 and display it
   * const imageElement = document.createElement('img');
   * imageElement.src = `data:image/jpeg;base64,${base64Image}`;
   * const imageContainer = document.getElementById('#imageContainer');
   * if (imageContainer) {
   *   imageContainer.innerHTML = '';
   *   imageContainer.appendChild(imageElement);
   * }
   * ```
   *
   * For more information, see [Camera
   * API](https://docs.viam.com/dev/reference/apis/components/camera/#getimage).
   *
   * @param mimeType - A specific MIME type to request. This is not necessarily
   *   the same type that will be returned.
   */
  getImage: (mimeType?: MimeType, extra?: Struct) => Promise<Uint8Array>;

  /**
   * Return a frame from a camera.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const images = await camera.getImages();
   * ```
   *
   * TODO(docs): include docs link for get images TS example
   *
   * @param filterSourceNames - A list of source names to filter the images by.
   *   If empty or undefined, all images will be returned.
   * @param extra - Extra parameters to pass to the camera.
   */
  getImages: (
    filterSourceNames?: string[],
    extra?: Struct
  ) => Promise<[NamedImage[], ResponseMetadata]>;

  /**
   * Render a frame from a camera to an HTTP response.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const mimeType = 'image/jpeg';
   * const image = await camera.renderFrame(mimeType);
   * ```
   *
   * For more information, see [Camera
   * API](https://docs.viam.com/dev/reference/apis/components/camera/#renderframe).
   *
   * @param mimeType - A specific MIME type to request. This is not necessarily
   *   the same type that will be returned.
   */
  renderFrame: (mimeType?: MimeType, extra?: Struct) => Promise<Blob>;

  /**
   * Return a point cloud from a camera.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const pointCloud = await camera.getPointCloud();
   * ```
   *
   * For more information, see [Camera
   * API](https://docs.viam.com/dev/reference/apis/components/camera/#getpointcloud).
   */
  getPointCloud: (extra?: Struct) => Promise<Uint8Array>;

  /**
   * Return the camera properties.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const properties = await camera.getProperties();
   * ```
   *
   * For more information, see [Camera
   * API](https://docs.viam.com/dev/reference/apis/components/camera/#getproperties).
   */
  getProperties: () => Promise<Properties>;
}
