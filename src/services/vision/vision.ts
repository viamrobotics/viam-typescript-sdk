import type { MimeType } from '../../main';
import type { Resource, StructType } from '../../types';
import type { Classification, Detection, PointCloudObject } from './types';

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
    extra?: StructType
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
    extra?: StructType
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
    extra?: StructType
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
    extra?: StructType
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
    extra?: StructType
  ) => Promise<PointCloudObject[]>;
}
