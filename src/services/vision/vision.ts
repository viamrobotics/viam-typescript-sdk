import type { Struct } from '@bufbuild/protobuf';
import type { MimeType } from '../../main';
import type { Resource } from '../../types';
import type {
  CaptureAllOptions,
  CaptureAllResponse,
  Classification,
  Detection,
  PointCloudObject,
  Properties,
} from './types';

/** A service that enables various computer vision algorithms */
export interface Vision extends Resource {
  /**
   * Get a list of detections in the next image given a camera.
   *
   * @example
   *
   * ```ts
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   * const detections = await vision.getDetectionsFromCamera('my_camera');
   * ```
   *
   * @param cameraName - The name of the camera to use for detection.
   * @returns - The list of Detections.
   */
  getDetectionsFromCamera: (
    cameraName: string,
    extra?: Struct
  ) => Promise<Detection[]>;

  /**
   * Get a list of detections in the given image.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   *
   * const mimeType = 'image/jpeg';
   * const image = await camera.getImage(mimeType);
   * const detections = await vision.getDetections(
   *   image,
   *   width,
   *   height,
   *   mimeType
   * );
   * ```
   *
   * @param image - The image from which to get detections.
   * @param width - The width of the image.
   * @param height - The height of the image.
   * @param mimeType - The MimeType of the image.
   * @returns - The list of Detections.
   */
  getDetections: (
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    extra?: Struct
  ) => Promise<Detection[]>;

  /**
   * Get a list of classifications in the next image given a camera.
   *
   * @example
   *
   * ```ts
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   * const classifications = await vision.getClassificationsFromCamera(
   *   'my_camera',
   *   10
   * );
   * ```
   *
   * @param cameraName - The name of the camera to use for classification.
   * @param count - The number of Classifications requested.
   * @returns - The list of Classifications.
   */
  getClassificationsFromCamera: (
    cameraName: string,
    count: number,
    extra?: Struct
  ) => Promise<Classification[]>;

  /**
   * Get a list of classifications in the given image.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, 'my_camera');
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   *
   * const mimeType = 'image/jpeg';
   * const image = await camera.getImage(mimeType);
   * const classifications = await vision.getClassifications(
   *   image,
   *   600,
   *   600,
   *   mimeType,
   *   10
   * );
   * ```
   *
   * @param image - The image from which to get classifications.
   * @param width - The width of the image.
   * @param height - The height of the image.
   * @param mimeType - The MimeType of the image.
   * @param count - The number of Classifications requested.
   * @returns - The list of Classifications.
   */
  getClassifications: (
    image: Uint8Array,
    width: number,
    height: number,
    mimeType: MimeType,
    count: number,
    extra?: Struct
  ) => Promise<Classification[]>;

  /**
   * Returns a list of the 3D point cloud objects and associated metadata in the
   * latest picture obtained from the specified 3D camera.
   *
   * @example
   *
   * ```ts
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   * const pointCloudObjects =
   *   await vision.getObjectPointClouds('my_camera');
   * ```
   *
   * @param cameraName - The name of the camera.
   * @returns - The list of PointCloudObjects
   */
  getObjectPointClouds: (
    cameraName: string,
    extra?: Struct
  ) => Promise<PointCloudObject[]>;

  /**
   * Returns an object describing the properties of the vision service, namely
   * booleans indicating whether classifications, detections, and 3d
   * segmentation are supported.
   *
   * @example
   *
   * ```ts
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   * const properties = await vision.getProperties();
   * ```
   *
   * @returns - The properties of the vision service
   */
  getProperties: (extra?: Struct) => Promise<Properties>;

  /**
   * Returns the requested image, classifications, detections, and 3d point
   * cloud objects in the next image given a camera.
   *
   * @example
   *
   * ```ts
   * const vision = new VIAM.VisionClient(machine, 'my_vision');
   * const captureAll = await vision.captureAllFromCamera('my_camera', {
   *   returnImage: true,
   *   returnClassifications: true,
   *   returnDetections: true,
   *   returnObjectPointClouds: true,
   * });
   * ```
   *
   * @param cameraName - The name of the camera to use for classification,
   *   detection, and segmentation.
   * @param opts - The fields desired in the response.
   * @returns - The requested image, classifications, detections, and 3d point
   *   cloud objects.
   */
  captureAllFromCamera: (
    cameraName: string,
    opts: CaptureAllOptions,
    extra?: Struct
  ) => Promise<CaptureAllResponse>;
}
