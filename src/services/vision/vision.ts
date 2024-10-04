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
   * @returns - The properties of the vision service
   */
  getProperties: (extra?: Struct) => Promise<Properties>;

  /**
   * Returns the requested image, classifications, detections, and 3d point
   * cloud objects in the next image given a camera.
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
