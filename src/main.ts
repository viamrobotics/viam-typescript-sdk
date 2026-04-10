export const version = __VERSION__;

export {
  RobotClient as Client,
  type CloudMetadata,
  createRobotClient,
  type DialConf,
  type DialDirectConf,
  type DialWebRTCConf,
  type Robot,
  RobotClient,
} from './robot';
/**
 * Raw Protobuf interfaces for a Robot component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link RobotClient} instead.
 * @group Raw Protobufs
 */
export {
  type BinaryDataCaptureUploadOptions,
  type BinaryID,
  type DataClient,
  type FilterOptions,
  type IndexableCollection,
} from './app/data-client';
export {
  createViamClient,
  type ViamClient,
  type ViamClientOptions,
} from './app/viam-client';
export {
  type AccessToken,
  type Credential,
  type Credentials,
  type CredentialType,
} from './app/viam-transport';
export * as robotApi from './gen/robot/v1/robot_pb';
/**
 * Raw Protobuf interfaces for Data.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link DataClient} instead.
 * @group Raw Protobufs
 */
export { type AppClient } from './app/app-client';
export * as dataApi from './gen/app/data/v1/data_pb';
/**
 * Raw Protobuf interfaces for an App service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link AppClient} instead.
 * @group Raw Protobufs
 */
export {
  type MlTrainingClient,
  ModelType,
  TrainingStatus,
} from './app/ml-training-client';
export * as appApi from './gen/app/v1/app_pb';
export * as appRobotApi from './gen/app/v1/robot_pb';
/**
 * Raw Protobuf interfaces for ML Training.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MlTrainingClient} instead.
 * @group Raw Protobufs
 */
export type {
  CloudConfig,
  ProvisioningClient,
} from './app/provisioning-client';
export * as mlTrainingApi from './gen/app/mltraining/v1/ml_training_pb';
/**
 * Raw Protobuf interfaces for Provisioning.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ProvisioningClient} instead.
 * @group Raw Protobufs
 */
export { type BillingClient } from './app/billing-client';
export * as provisioningApi from './gen/provisioning/v1/provisioning_pb';
/**
 * Raw Protobuf interfaces for Billing.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BillingClient} instead.
 * @group Raw Protobufs
 */
export {
  AudioCodec,
  type AudioCodecType,
  type AudioProperties,
} from './audio-common';
export { type Arm, ArmClient, type ArmJointPositions } from './components/arm';
export {
  type AudioChunk,
  type AudioIn,
  AudioInClient,
} from './components/audioin';
export { type AudioOut, AudioOutClient } from './components/audioout';
export * as billingApi from './gen/app/v1/billing_pb';
/**
 * Raw Protobuf interfaces for an Arm component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ArmClient} instead.
 * @group Raw Protobufs
 */
export { type Base, BaseClient, type BaseProperties } from './components/base';
export * as armApi from './gen/component/arm/v1/arm_pb';
/**
 * Raw Protobuf interfaces for a Base component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BaseClient} instead.
 * @group Raw Protobufs
 */
export {
  type AnalogValue,
  type Board,
  BoardClient,
  type PowerMode,
  type Tick,
} from './components/board';
export * as baseApi from './gen/component/base/v1/base_pb';
/**
 * Raw Protobuf interfaces for a Board component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BoardClient} instead.
 * @group Raw Protobufs
 */
export { type Button, ButtonClient } from './components/button';
export * as boardApi from './gen/component/board/v1/board_pb';
/**
 * Raw Protobuf interfaces for a Button component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ButtonClient} instead.
 * @group Raw Protobufs
 */
export { type Camera, CameraClient, type MimeType } from './components/camera';
export * as buttonApi from './gen/component/button/v1/button_pb';
/**
 * Raw Protobuf interfaces for a Camera component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link CameraClient} instead.
 * @group Raw Protobufs
 */
export * as cameraApi from './gen/component/camera/v1/camera_pb';
export { type Discovery, DiscoveryClient } from './services/discovery';
/**
 * Raw Protobuf interfaces for a Discovery service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link DiscoveryService} instead.
 * @group Raw Protobufs
 */
export {
  type Encoder,
  EncoderClient,
  EncoderPositionType,
  type EncoderProperties,
} from './components/encoder';
export * as discoveryApi from './gen/service/discovery/v1/discovery_pb';
/**
 * Raw Protobuf interfaces for an Encoder component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link EncoderClient} instead.
 * @group Raw Protobufs
 */
export { type Gantry, GantryClient } from './components/gantry';
export * as encoderApi from './gen/component/encoder/v1/encoder_pb';
/**
 * Raw Protobuf interfaces for a Gantry component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GantryClient} instead.
 * @group Raw Protobufs
 */
export { type Motor, MotorClient } from './components/motor';
export * as gantryApi from './gen/component/gantry/v1/gantry_pb';
export {
  type FlatTensors,
  type Metadata,
  type MLModel,
  MLModelClient,
  type TensorInfo,
} from './services/ml-model';
/**
 * Raw Protobuf interfaces for a Motor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MotorClient} instead.
 * @group Raw Protobufs
 */
export {
  type MovementSensor,
  type MovementSensorAccuracy,
  MovementSensorClient,
  type MovementSensorPosition,
  type MovementSensorProperties,
} from './components/movementsensor';
export * as motorApi from './gen/component/motor/v1/motor_pb';
/**
 * Raw Protobuf interfaces for a MovementSensor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MovementSensorClient} instead.
 * @group Raw Protobufs
 */
export { type PowerSensor, PowerSensorClient } from './components/powersensor';
export * as movementSensorApi from './gen/component/movementsensor/v1/movementsensor_pb';
/**
 * Raw Protobuf interfaces for a PowerSensor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link PowerSensorClient} instead.
 * @group Raw Protobufs
 */
export { type Sensor, SensorClient } from './components/sensor';
export * as powerSensorApi from './gen/component/powersensor/v1/powersensor_pb';
/**
 * Raw Protobuf interfaces generated with
 * https://github.com/connectrpc/connect-es for a Sensor component.
 *
 * @deprecated Use {@link SensorClient} instead.
 * @group Raw Protobufs
 */
export { type Stream, StreamClient } from './extra/stream';
export * as sensorApi from './gen/component/sensor/v1/sensor_pb';
/**
 * Raw Protobuf interfaces for a Stream.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link StreamClient} instead.
 * @group Raw Protobufs
 */
export { type Switch, SwitchClient } from './components/switch';
export * as streamApi from './gen/stream/v1/stream_pb';
/**
 * Raw Protobuf interfaces for a Switch component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link SwitchClient} instead.
 * @group Raw Protobufs
 */
export {
  type Generic as GenericComponent,
  GenericClient as GenericComponentClient,
} from './components/generic';
export { type PoseTracker, PoseTrackerClient } from './components/posetracker';
export * as switchApi from './gen/component/switch/v1/switch_pb';

/**
 * Raw Protobuf interfaces for a Generic component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GenericComponentClient} instead.
 * @group Raw Protobufs
 */
export { type Gripper, GripperClient } from './components/gripper';
export * as genericComponentApi from './gen/component/generic/v1/generic_pb';
/**
 * Raw Protobuf interfaces for a Gripper component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GripperClient} instead.
 * @group Raw Protobufs
 */
export * from './components/inputcontroller';
export * as gripperApi from './gen/component/gripper/v1/gripper_pb';
/**
 * Raw Protobuf interfaces for an InputController component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GripperClient} instead.
 * @group Raw Protobufs
 */
export * as inputControllerApi from './gen/component/inputcontroller/v1/input_controller_pb';
export {
  type CollisionSpecification,
  type Constraints,
  type GetPlanResponse,
  type LinearConstraint,
  type ListPlanStatusesResponse,
  type Motion,
  MotionClient,
  type MotionConfiguration,
  type ObstacleDetector,
  type OrientationConstraint,
  type PlanState,
} from './services/motion';
/**
 * Raw Protobuf interfaces for a Motion service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MotionClient} instead.
 * @group Raw Protobufs
 */
export * as motionApi from './gen/service/motion/v1/motion_pb';
export { type DataManager, DataManagerClient } from './services/data-manager';
/**
 * Raw Protobuf interfaces for a DataManager service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link DataManagerClient} instead.
 * @group Raw Protobufs
 */
export * as dataManagerApi from './gen/service/datamanager/v1/data_manager_pb';
export {
  type Mode,
  NavigationClient,
  type NavigationPosition,
  type NavigationProperties,
  type Path,
  type Waypoint,
} from './services/navigation';
/**
 * Raw Protobuf interfaces for a Navigation service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link NavigationClient} instead.
 * @group Raw Protobufs
 */
export { type Servo, ServoClient } from './components/servo';
export * as navigationApi from './gen/service/navigation/v1/navigation_pb';
/**
 * Raw Protobuf interfaces for a Servo component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ServoClient} instead.
 * @group Raw Protobufs
 */
export * as servoApi from './gen/component/servo/v1/servo_pb';
export {
  SlamClient,
  type SlamPosition,
  type SlamProperties,
} from './services/slam';
/**
 * Raw Protobuf interfaces for a Slam service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link SlamClient} instead.
 * @group Raw Protobufs
 */
export * as slamApi from './gen/service/slam/v1/slam_pb';
export {
  type Classification,
  type Detection,
  type PointCloudObject,
  VisionClient,
} from './services/vision';
/**
 * Raw Protobuf interfaces for a Vision service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link VisionClient} instead.
 * @group Raw Protobufs
 */
export * as visionApi from './gen/service/vision/v1/vision_pb';
export {
  type Generic as GenericService,
  GenericClient as GenericServiceClient,
} from './services/generic';
export * from './services/video';
export * from './services/world-state-store';
/**
 * Raw Protobuf interfaces for a Generic service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GenericServiceClient} instead.
 * @group Raw Protobufs
 */
export * as genericServiceApi from './gen/service/generic/v1/generic_pb';

/**
 * Raw Protobuf interfaces that are shared across multiple components and
 * services.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @group Raw Protobufs
 */
export { MachineConnectionEvent } from './events';
export * as commonApi from './gen/common/v1/common_pb';
export * from './types';
export {
  addMetadata,
  deleteMetadata,
  disableDebugLogging,
  doCommandFromClient,
  enableDebugLogging,
  getStatusFromClient,
} from './utils';
