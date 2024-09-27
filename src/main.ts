export const version = __VERSION__;

/**
 * Raw Protobuf interfaces for a Robot component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link RobotClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * as robotApi from './gen/robot/v1/robot_pb';
export {
  RobotClient,
  createRobotClient,
  type CloudMetadata,
  type DialConf,
  type DialDirectConf,
  type DialWebRTCConf,
  type Robot,
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

export {
  type AccessToken,
  type Credential,
  type CredentialType,
  type Credentials,
} from './app/viam-transport';

/**
 * Raw Protobuf interfaces for Data.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link DataClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  type BinaryID,
  type DataClient,
  type FilterOptions,
} from './app/data-client';
export * as dataApi from './gen/app/data/v1/data_pb';

/**
 * Raw Protobuf interfaces for an App service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link AppClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { type AppClient } from './app/app-client';
export * as appApi from './gen/app/v1/app_pb';

/**
 * Raw Protobuf interfaces for ML Training.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MlTrainingClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  ModelType,
  TrainingStatus,
  type MlTrainingClient,
} from './app/ml-training-client';
export * as mlTrainingApi from './gen/app/mltraining/v1/ml_training_pb';

/**
 * Raw Protobuf interfaces for Provisioning.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ProvisioningClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  type CloudConfig,
  type ProvisioningClient,
} from './app/provisioning-client';
export * as provisioningApi from './gen/provisioning/v1/provisioning_pb';

/**
 * Raw Protobuf interfaces for Billing.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BillingClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { type BillingClient } from './app/billing-client';
export * as billingApi from './gen/app/v1/billing_pb';

/**
 * Raw Protobuf interfaces for an Arm component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ArmClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { ArmClient, type Arm, type ArmJointPositions } from './components/arm';
export * as armApi from './gen/component/arm/v1/arm_pb';

/**
 * Raw Protobuf interfaces for a Base component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BaseClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { BaseClient, type Base, type BaseProperties } from './components/base';
export * as baseApi from './gen/component/base/v1/base_pb';

/**
 * Raw Protobuf interfaces for a Board component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BoardClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  BoardClient,
  PowerMode,
  type AnalogValue,
  type Board,
  type Tick,
} from './components/board';
export * as boardApi from './gen/component/board/v1/board_pb';

/**
 * Raw Protobuf interfaces for a Camera component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link CameraClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { CameraClient, type Camera, type MimeType } from './components/camera';
export * as cameraApi from './gen/component/camera/v1/camera_pb';

/**
 * Raw Protobuf interfaces for an Encoder component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link EncoderClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  EncoderClient,
  EncoderPositionType,
  type Encoder,
  type EncoderProperties,
} from './components/encoder';
export * as encoderApi from './gen/component/encoder/v1/encoder_pb';

/**
 * Raw Protobuf interfaces for a Gantry component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GantryClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { GantryClient, type Gantry } from './components/gantry';
export * as gantryApi from './gen/component/gantry/v1/gantry_pb';

/**
 * Raw Protobuf interfaces for a Motor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MotorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { MotorClient, type Motor } from './components/motor';
export * as motorApi from './gen/component/motor/v1/motor_pb';

/**
 * Raw Protobuf interfaces for a MovementSensor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MovementSensorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  MovementSensorClient,
  type MovementSensor,
  type MovementSensorAccuracy,
  type MovementSensorPosition,
  type MovementSensorProperties,
} from './components/movementsensor';
export * as movementSensorApi from './gen/component/movementsensor/v1/movementsensor_pb';

/**
 * Raw Protobuf interfaces for a PowerSensor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link PowerSensorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { PowerSensorClient, type PowerSensor } from './components/powersensor';
export * as powerSensorApi from './gen/component/powersensor/v1/powersensor_pb';

/**
 * Raw Protobuf interfaces generated with
 * https://github.com/connectrpc/connect-es for a Sensor component.
 *
 * @deprecated Use {@link SensorClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { SensorClient, type Sensor } from './components/sensor';
export * as sensorApi from './gen/component/sensor/v1/sensor_connect';

/**
 * Raw Protobuf interfaces for a Sensors service.
 *
 * Generated with https://github.com/connectrpc/connect-es
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
export * as sensorsApi from './gen/service/sensors/v1/sensors_pb';

/**
 * Raw Protobuf interfaces for a Stream.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link StreamClient} instead.
 * @group Raw Protobufs
 */
export { StreamClient, type Stream } from './extra/stream';
export * as streamApi from './gen/stream/v1/stream_pb';

/**
 * Raw Protobuf interfaces for a Generic component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GenericComponentClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export {
  GenericClient as GenericComponentClient,
  type Generic as GenericComponent,
} from './components/generic';
export * as genericComponentApi from './gen/component/generic/v1/generic_connect';

/**
 * Raw Protobuf interfaces for a Gripper component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GripperClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { GripperClient, type Gripper } from './components/gripper';
export * as gripperApi from './gen/component/gripper/v1/gripper_pb';

/**
 * Raw Protobuf interfaces for an InputController component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GripperClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * from './components/inputcontroller';
export * as inputControllerApi from './gen/component/inputcontroller/v1/input_controller_pb';

/**
 * Raw Protobuf interfaces for a Motion service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MotionClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * as motionApi from './gen/service/motion/v1/motion_pb';
export {
  MotionClient,
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
} from './services/motion';

export { DataManagerClient, type DataManager } from './services/data-manager';

/**
 * Raw Protobuf interfaces for a Navigation service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link NavigationClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * as navigationApi from './gen/service/navigation/v1/navigation_pb';
export {
  NavigationClient,
  type Mode,
  type NavigationPosition,
  type NavigationProperties,
  type Path,
  type Waypoint,
} from './services/navigation';

/**
 * Raw Protobuf interfaces for a Servo component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ServoClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export { ServoClient, type Servo } from './components/servo';
export * as servoApi from './gen/component/servo/v1/servo_pb';

/**
 * Raw Protobuf interfaces for a Slam service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link SlamClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * as slamApi from './gen/service/slam/v1/slam_pb';
export {
  SlamClient,
  type SlamPosition,
  type SlamProperties,
} from './services/slam';

/**
 * Raw Protobuf interfaces for a Vision service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link VisionClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * as visionApi from './gen/service/vision/v1/vision_pb';
export {
  VisionClient,
  type Classification,
  type Detection,
  type PointCloudObject,
} from './services/vision';

/**
 * Raw Protobuf interfaces for a Generic service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GenericServiceClient} instead.
 * @alpha
 * @group Raw Protobufs
 */
export * as genericServiceApi from './gen/service/generic/v1/generic_connect';
export {
  GenericClient as GenericServiceClient,
  type Generic as GenericService,
} from './services/generic';

/**
 * Raw Protobuf interfaces that are shared across multiple components and
 * services.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @alpha
 * @group Raw Protobufs
 */
export * as commonApi from './gen/common/v1/common_pb';

export * from './types';

export { doCommandFromClient } from './utils';

export { MachineConnectionEvent } from './events';
