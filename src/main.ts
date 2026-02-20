export const version = __VERSION__;

export {
  RobotClient as Client,
  createRobotClient,
  RobotClient,
  type CloudMetadata,
  type DialConf,
  type DialDirectConf,
  type DialWebRTCConf,
  type Robot,
} from './robot';
/**
 * Raw Protobuf interfaces for a Robot component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link RobotClient} instead.
 * @group Raw Protobufs
 */
export * as robotApi from './gen/robot/v1/robot_pb';

export {
  createViamClient,
  type MachineConnectionResult,
  type ViamClient,
  type ViamClientOptions,
} from './app/viam-client';

export {
  type AccessToken,
  type Credential,
  type Credentials,
  type CredentialType,
} from './app/viam-transport';

export {
  type BinaryID,
  type DataClient,
  type FilterOptions,
  type IndexableCollection,
} from './app/data-client';
/**
 * Raw Protobuf interfaces for Data.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link DataClient} instead.
 * @group Raw Protobufs
 */
export * as dataApi from './gen/app/data/v1/data_pb';

export { type AppClient } from './app/app-client';
/**
 * Raw Protobuf interfaces for an App service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link AppClient} instead.
 * @group Raw Protobufs
 */
export * as appApi from './gen/app/v1/app_pb';
export * as appRobotApi from './gen/app/v1/robot_pb';

export {
  ModelType,
  TrainingStatus,
  type MlTrainingClient,
} from './app/ml-training-client';
/**
 * Raw Protobuf interfaces for ML Training.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MlTrainingClient} instead.
 * @group Raw Protobufs
 */
export * as mlTrainingApi from './gen/app/mltraining/v1/ml_training_pb';

export {
  CloudConfig,
  type ProvisioningClient,
} from './app/provisioning-client';
/**
 * Raw Protobuf interfaces for Provisioning.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ProvisioningClient} instead.
 * @group Raw Protobufs
 */
export * as provisioningApi from './gen/provisioning/v1/provisioning_pb';

export { type BillingClient } from './app/billing-client';
/**
 * Raw Protobuf interfaces for Billing.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BillingClient} instead.
 * @group Raw Protobufs
 */
export * as billingApi from './gen/app/v1/billing_pb';

export { ArmClient, ArmJointPositions, type Arm } from './components/arm';
export {
  AudioInClient,
  type AudioIn,
  type AudioChunk,
} from './components/audioin';
export { AudioOutClient, type AudioOut } from './components/audioout';
export {
  AudioCodec,
  type AudioCodecType,
  type AudioProperties,
} from './audio-common';
/**
 * Raw Protobuf interfaces for an Arm component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ArmClient} instead.
 * @group Raw Protobufs
 */
export * as armApi from './gen/component/arm/v1/arm_pb';

export { BaseClient, BaseProperties, type Base } from './components/base';
/**
 * Raw Protobuf interfaces for a Base component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BaseClient} instead.
 * @group Raw Protobufs
 */
export * as baseApi from './gen/component/base/v1/base_pb';

export {
  AnalogValue,
  BoardClient,
  PowerMode,
  type Board,
  type Tick,
} from './components/board';
/**
 * Raw Protobuf interfaces for a Board component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link BoardClient} instead.
 * @group Raw Protobufs
 */
export * as boardApi from './gen/component/board/v1/board_pb';

export { ButtonClient, type Button } from './components/button';
/**
 * Raw Protobuf interfaces for a Button component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ButtonClient} instead.
 * @group Raw Protobufs
 */
export * as buttonApi from './gen/component/button/v1/button_pb';

export { CameraClient, type Camera, type MimeType } from './components/camera';
/**
 * Raw Protobuf interfaces for a Camera component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link CameraClient} instead.
 * @group Raw Protobufs
 */
export * as cameraApi from './gen/component/camera/v1/camera_pb';

export { DiscoveryClient, type Discovery } from './services/discovery';
/**
 * Raw Protobuf interfaces for a Discovery service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link DiscoveryService} instead.
 * @group Raw Protobufs
 */
export * as discoveryApi from './gen/service/discovery/v1/discovery_pb';

export {
  EncoderClient,
  EncoderPositionType,
  EncoderProperties,
  type Encoder,
} from './components/encoder';
/**
 * Raw Protobuf interfaces for an Encoder component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link EncoderClient} instead.
 * @group Raw Protobufs
 */
export * as encoderApi from './gen/component/encoder/v1/encoder_pb';

export { GantryClient, type Gantry } from './components/gantry';
/**
 * Raw Protobuf interfaces for a Gantry component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GantryClient} instead.
 * @group Raw Protobufs
 */
export * as gantryApi from './gen/component/gantry/v1/gantry_pb';

export {
  MLModelClient,
  type FlatTensors,
  type Metadata,
  type MLModel,
  type TensorInfo,
} from './services/ml-model';

export { MotorClient, type Motor } from './components/motor';
/**
 * Raw Protobuf interfaces for a Motor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MotorClient} instead.
 * @group Raw Protobufs
 */
export * as motorApi from './gen/component/motor/v1/motor_pb';

export {
  MovementSensorAccuracy,
  MovementSensorClient,
  MovementSensorPosition,
  MovementSensorProperties,
  type MovementSensor,
} from './components/movementsensor';
/**
 * Raw Protobuf interfaces for a MovementSensor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link MovementSensorClient} instead.
 * @group Raw Protobufs
 */
export * as movementSensorApi from './gen/component/movementsensor/v1/movementsensor_pb';

export { PowerSensorClient, type PowerSensor } from './components/powersensor';
/**
 * Raw Protobuf interfaces for a PowerSensor component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link PowerSensorClient} instead.
 * @group Raw Protobufs
 */
export * as powerSensorApi from './gen/component/powersensor/v1/powersensor_pb';

export { SensorClient, type Sensor } from './components/sensor';
/**
 * Raw Protobuf interfaces generated with
 * https://github.com/connectrpc/connect-es for a Sensor component.
 *
 * @deprecated Use {@link SensorClient} instead.
 * @group Raw Protobufs
 */
export * as sensorApi from './gen/component/sensor/v1/sensor_connect';

export { StreamClient, type Stream } from './extra/stream';
/**
 * Raw Protobuf interfaces for a Stream.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link StreamClient} instead.
 * @group Raw Protobufs
 */
export * as streamApi from './gen/stream/v1/stream_pb';

export { SwitchClient, type Switch } from './components/switch';
/**
 * Raw Protobuf interfaces for a Switch component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link SwitchClient} instead.
 * @group Raw Protobufs
 */
export * as switchApi from './gen/component/switch/v1/switch_pb';

export {
  GenericClient as GenericComponentClient,
  type Generic as GenericComponent,
} from './components/generic';

export { PoseTrackerClient, type PoseTracker } from './components/posetracker';

/**
 * Raw Protobuf interfaces for a Generic component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GenericComponentClient} instead.
 * @group Raw Protobufs
 */
export * as genericComponentApi from './gen/component/generic/v1/generic_connect';

export { GripperClient, type Gripper } from './components/gripper';
/**
 * Raw Protobuf interfaces for a Gripper component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GripperClient} instead.
 * @group Raw Protobufs
 */
export * as gripperApi from './gen/component/gripper/v1/gripper_pb';

export * from './components/inputcontroller';
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
  CollisionSpecification,
  Constraints,
  LinearConstraint,
  ListPlanStatusesResponse,
  MotionClient,
  MotionConfiguration,
  ObstacleDetector,
  OrientationConstraint,
  type GetPlanResponse,
  type Motion,
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

export { DataManagerClient, type DataManager } from './services/data-manager';
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
  NavigationClient,
  NavigationPosition,
  NavigationProperties,
  Path,
  Waypoint,
  type Mode,
} from './services/navigation';
/**
 * Raw Protobuf interfaces for a Navigation service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link NavigationClient} instead.
 * @group Raw Protobufs
 */
export * as navigationApi from './gen/service/navigation/v1/navigation_pb';

export { ServoClient, type Servo } from './components/servo';
/**
 * Raw Protobuf interfaces for a Servo component.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link ServoClient} instead.
 * @group Raw Protobufs
 */
export * as servoApi from './gen/component/servo/v1/servo_pb';

export { SlamClient, SlamPosition, SlamProperties } from './services/slam';
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
  Classification,
  Detection,
  PointCloudObject,
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

export * from './services/world-state-store';

export * from './services/video';

export {
  GenericClient as GenericServiceClient,
  type Generic as GenericService,
} from './services/generic';
/**
 * Raw Protobuf interfaces for a Generic service.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @deprecated Use {@link GenericServiceClient} instead.
 * @group Raw Protobufs
 */
export * as genericServiceApi from './gen/service/generic/v1/generic_connect';

/**
 * Raw Protobuf interfaces that are shared across multiple components and
 * services.
 *
 * Generated with https://github.com/connectrpc/connect-es
 *
 * @group Raw Protobufs
 */
export * as commonApi from './gen/common/v1/common_pb';

export * from './types';

export {
  addMetadata,
  deleteMetadata,
  disableDebugLogging,
  doCommandFromClient,
  enableDebugLogging,
} from './utils';

export { MachineConnectionEvent } from './events';
