import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { Geometry } from "../../gen/common/v1/common_pb";
import type {
  DistortionParameters,
  IntrinsicParameters,
} from "../../gen/component/camera/v1/camera_pb";
import type { JsonObject, Resource } from "../../types";

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
  | ""
  | "image/vnd.viam.rgba"
  | "image/vnd.viam.depth"
  | "image/jpeg"
  | "image/png"
  | "pointcloud/pcd"
  | "unsupported";

/** Represents any physical hardware that can capture frames. */
export interface Camera extends Resource {
  /** Get the geometries of the component in their current configuration */
  getGeometries: (extra?: JsonObject) => Promise<Geometry[]>;

  /**
   * Return a frame from a camera.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, "my_camera");
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
    extra?: JsonObject,
  ) => Promise<{ images: NamedImage[]; metadata: ResponseMetadata }>;

  /**
   * Return a point cloud from a camera.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, "my_camera");
   * const pointCloud = await camera.getPointCloud();
   * ```
   *
   * For more information, see [Camera
   * API](https://docs.viam.com/dev/reference/apis/components/camera/#getpointcloud).
   */
  getPointCloud: (extra?: JsonObject) => Promise<Uint8Array>;

  /**
   * Return the camera properties.
   *
   * @example
   *
   * ```ts
   * const camera = new VIAM.CameraClient(machine, "my_camera");
   * const properties = await camera.getProperties();
   * ```
   *
   * For more information, see [Camera
   * API](https://docs.viam.com/dev/reference/apis/components/camera/#getproperties).
   */
  getProperties: () => Promise<Properties>;
}
