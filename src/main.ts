export const version = __VERSION__;

/**
 * Raw Protobuf interfaces for a Robot component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link RobotClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as robotApi } from './gen/robot/v1/robot_pb';
export {
  type Robot,
  type DialConf,
  type DialDirectConf,
  type DialWebRTCConf,
  type RobotStatusStream,
  type CloudMetadata,
  RobotClient,
  createRobotClient,
} from './robot';

/**
 * @deprecated Use {@link RobotClient} instead.
 * @group Clients
 */
export { RobotClient as Client } from './robot';

export {
  createViamClient,
  type ViamClient,
  type ViamClientOptions,
} from './app/viam-client';

export type {
  Credential,
  CredentialType,
  AccessToken,
} from './app/viam-transport';

/**
 * Raw Protobuf interfaces for a Data service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link DataClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as dataApi } from './gen/app/data/v1/data_pb';
export {
  type BinaryID,
  type DataClient,
  type FilterOptions,
} from './app/data-client';

/**
 * Raw Protobuf interfaces for an Arm component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link ArmClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as armApi } from './gen/component/arm/v1/arm_pb';
export { type Arm, ArmClient } from './components/arm';

/**
 * Raw Protobuf interfaces for a Base component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link BaseClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as baseApi } from './gen/component/base/v1/base_pb';
export { type Base, type BaseProperties, BaseClient } from './components/base';

/**
 * Raw Protobuf interfaces for a Board component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link BoardClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as boardApi } from './gen/component/board/v1/board_pb';
export {
  type Board,
  BoardClient,
  type Duration,
  PowerMode,
} from './components/board';

/**
 * Raw Protobuf interfaces for a Camera component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link CameraClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as cameraApi } from './gen/component/camera/v1/camera_pb';
export { type Camera, type MimeType, CameraClient } from './components/camera';

/**
 * Raw Protobuf interfaces for an Encoder component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link EncoderClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as encoderApi } from './gen/component/encoder/v1/encoder_pb';
export {
  type Encoder,
  type EncoderProperties,
  EncoderPositionType,
  EncoderClient,
} from './components/encoder';

/**
 * Raw Protobuf interfaces for a Gantry component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link GantryClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as gantryApi } from './gen/component/gantry/v1/gantry_pb';
export { type Gantry, GantryClient } from './components/gantry';

/**
 * Raw Protobuf interfaces for a Motor component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link MotorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as motorApi } from './gen/component/motor/v1/motor_pb';
export { type Motor, MotorClient } from './components/motor';

/**
 * Raw Protobuf interfaces for a MovementSensor component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link MovementSensorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as movementSensorApi } from './gen/component/movementsensor/v1/movementsensor_pb';
export {
  type MovementSensor,
  type MovementSensorProperties,
  type MovementSensorPosition,
  type MovementSensorAccuracy,
  MovementSensorClient,
} from './components/movementsensor';

/**
 * Raw Protobuf interfaces for a PowerSensor component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link PowerSensorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as powerSensorApi } from './gen/component/powersensor/v1/powersensor_pb';
export { type PowerSensor, PowerSensorClient } from './components/powersensor';

/**
 * Raw Protobuf interfaces generated with
 * https://github.com/improbable-eng/grpc-web for a Sensor component.
 *
 * @deprecated Use {@link SensorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as sensorApi } from './gen/component/sensor/v1/sensor_pb';
export { type Sensor, SensorClient } from './components/sensor';

/**
 * Raw Protobuf interfaces for a Sensors service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @example
 *
 * ```ts
 * import { grpc } from '@improbable-eng/grpc-web';
 *
 * const client = {}; // replace with a connected robot client
 *
 * const request = new sensorsApi.GetSensorsRequest();
 * request.setName('mysensors');
 *
 * client.sensorsService.getSensors(
 *   request,
 *   new grpc.Metadata(),
 *   (error, response) => {
 *     // do something with error or response
 *   }
 * );
 * ```
 *
 * @alpha
 * @group Raw Protobufs
 */
export { default as sensorsApi } from './gen/service/sensors/v1/sensors_pb';

/**
 * Raw Protobuf interfaces for a Stream.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link StreamClient} instead.
 * @group Raw Protobufs
 */
export { default as streamApi } from './gen/proto/stream/v1/stream_pb';
export { type Stream, StreamClient } from './extra/stream';

/**
 * Raw Protobuf interfaces for a Generic component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link GenericComponentClient} instead.
 * @deprecated Renamed to genericComponentApi
 * @alpha
 * @group Raw Protobufs
 */
export { default as genericApi } from './gen/component/generic/v1/generic_pb';
export { default as genericComponentApi } from './gen/component/generic/v1/generic_pb';
export {
  type Generic as GenericComponent,
  GenericClient as GenericComponentClient,
} from './components/generic';

/**
 * Raw Protobuf interfaces for a Gripper component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link GripperClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as gripperApi } from './gen/component/gripper/v1/gripper_pb';
export { type Gripper, GripperClient } from './components/gripper';

/**
 * Raw Protobuf interfaces for an InputController component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @example
 *
 * ```ts
 * import { grpc } from '@improbable-eng/grpc-web';
 *
 * const client = {}; // replace with a connected robot client
 *
 * const request = new inputControllerApi.GetControlsRequest();
 * request.setController('myinputcontroller');
 *
 * client.inputControllerService.getControls(
 *   request,
 *   new grpc.Metadata(),
 *   (error, response) => {
 *     // do something with error or response
 *   }
 * );
 * ```
 *
 * @alpha
 * @group Raw Protobufs
 */
export { default as inputControllerApi } from './gen/component/inputcontroller/v1/input_controller_pb';

/**
 * Raw Protobuf interfaces for a Motion service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link MotionClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as motionApi } from './gen/service/motion/v1/motion_pb';
export {
  type CollisionSpecification,
  type Constraints,
  type GetPlanResponse,
  type LinearConstraint,
  type ListPlanStatusesResponse,
  type Motion,
  type MotionConfiguration,
  type ObstacleDetector,
  type OrientationConstraint,
  type PlanState,
  MotionClient,
} from './services/motion';

export { type DataManager, DataManagerClient } from './services/data-manager';

/**
 * Raw Protobuf interfaces for a Navigation service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link NavigationClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as navigationApi } from './gen/service/navigation/v1/navigation_pb';
export {
  type ModeMap,
  type Waypoint,
  type NavigationPosition,
  type NavigationProperties,
  type Path,
  NavigationClient,
} from './services/navigation';

/**
 * Raw Protobuf interfaces for a Servo component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link ServoClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as servoApi } from './gen/component/servo/v1/servo_pb';
export { type Servo, ServoClient } from './components/servo';

/**
 * Raw Protobuf interfaces for a Slam service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link SlamClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as slamApi } from './gen/service/slam/v1/slam_pb';
export {
  type SlamPosition,
  type SlamProperties,
  SlamClient,
} from './services/slam';

/**
 * Raw Protobuf interfaces for a Vision service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link VisionClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as visionApi } from './gen/service/vision/v1/vision_pb';
export {
  type Detection,
  type Classification,
  type PointCloudObject,
  VisionClient,
} from './services/vision';

/**
 * Raw Protobuf interfaces for a Generic service.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @deprecated Use {@link GenericServiceClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { default as genericServiceApi } from './gen/service/generic/v1/generic_pb';
export {
  type Generic as GenericService,
  GenericClient as GenericServiceClient,
} from './services/generic';

/**
 * Raw Protobuf interfaces that are shared across multiple components and
 * services.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @alpha
 * @group Raw Protobufs
 */
export { default as commonApi } from './gen/common/v1/common_pb';

/**
 * Raw Protobuf response and error types.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @alpha
 * @group Raw Protobufs
 */
export type {
  ResponseStream,
  ServiceError,
} from './gen/robot/v1/robot_pb_service';

export * from './types';

export { doCommandFromClient, promisify } from './utils';
