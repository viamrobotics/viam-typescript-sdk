export const version = __VERSION__;

export { robotProto as robotApi } from './proto/main';
export { dataProto as dataApi } from './proto/main';
export { appProto as appApi } from './proto/main';
export { appRobotProto as appRobotApi } from './proto/main';
export { mlTrainingProto as mlTrainingApi } from './proto/main';
export { provisioningProto as provisioningApi } from './proto/main';
export { billingProto as billingApi } from './proto/main';
export { armProto as armApi } from './proto/main';
export { audioInProto as audioInApi } from './proto/main';
export { audioOutProto as audioOutApi } from './proto/main';
export { baseProto as baseApi } from './proto/main';
export { boardProto as boardApi } from './proto/main';
export { buttonProto as buttonApi } from './proto/main';
export { cameraProto as cameraApi } from './proto/main';
export { discoveryProto as discoveryApi } from './proto/main';
export { encoderProto as encoderApi } from './proto/main';
export { gantryProto as gantryApi } from './proto/main';
export { motorProto as motorApi } from './proto/main';
export { movementSensorProto as movementSensorApi } from './proto/main';
export { powerSensorProto as powerSensorApi } from './proto/main';
export { sensorProto as sensorApi } from './proto/main';
export { streamProto as streamApi } from './proto/main';
export { switchProto as switchApi } from './proto/main';
export { genericComponentProto as genericComponentApi } from './proto/main';
export { gripperProto as gripperApi } from './proto/main';
export { inputControllerProto as inputControllerApi } from './proto/main';
export { motionProto as motionApi } from './proto/main';
export { dataManagerProto as dataManagerApi } from './proto/main';
export { navigationProto as navigationApi } from './proto/main';
export { servoProto as servoApi } from './proto/main';
export { slamProto as slamApi } from './proto/main';
export { visionProto as visionApi } from './proto/main';
export { genericServiceProto as genericServiceApi } from './proto/main';
export { commonProto as commonApi } from './proto/main';

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

export {
  type AccessToken,
  type Credential,
  type Credentials,
  type CredentialType,
} from './app/viam-transport';

export { createViamClient, type ViamClient, type ViamClientOptions } from './app/viam-client';

export {
  type BinaryDataCaptureUploadOptions,
  type DataClient,
  type FilterOptions,
  type IndexableCollection,
  type Sequence,
  type SequenceResourceFilter,
} from './app/data-client';

export { type AppClient } from './app/app-client';

export { type MlTrainingClient, ModelType, TrainingStatus } from './app/ml-training-client';

export type { CloudConfig, ProvisioningClient } from './app/provisioning-client';

export { type BillingClient } from './app/billing-client';

export { AudioCodec, type AudioCodecType, type AudioProperties } from './audio-common';
export { type AudioChunk, type AudioIn, AudioInClient } from './components/audioin';
export { type AudioOut, AudioOutClient } from './components/audioout';

export { type Arm, ArmClient, type ArmJointPositions } from './components/arm';

export { type Base, BaseClient, type BaseProperties } from './components/base';

export {
  type AnalogValue,
  type Board,
  BoardClient,
  type PowerMode,
  type Tick,
} from './components/board';

export { type Button, ButtonClient } from './components/button';

export { type Camera, CameraClient, type MimeType } from './components/camera';

export { type Discovery, DiscoveryClient } from './services/discovery';

export {
  type Encoder,
  EncoderClient,
  EncoderPositionType,
  type EncoderProperties,
} from './components/encoder';

export { type Gantry, GantryClient } from './components/gantry';

export { type Motor, MotorClient } from './components/motor';

export {
  type FlatTensors,
  type Metadata,
  type MLModel,
  MLModelClient,
  type TensorInfo,
} from './services/ml-model';

export {
  type MovementSensor,
  type MovementSensorAccuracy,
  MovementSensorClient,
  type MovementSensorPosition,
  type MovementSensorProperties,
} from './components/movementsensor';

export { type PowerSensor, PowerSensorClient } from './components/powersensor';

export { type Sensor, SensorClient } from './components/sensor';

export { type Stream, StreamClient } from './extra/stream';

export { type Switch, SwitchClient } from './components/switch';

export {
  type Generic as GenericComponent,
  GenericClient as GenericComponentClient,
} from './components/generic';

export { type PoseTracker, PoseTrackerClient } from './components/posetracker';

export { type Gripper, GripperClient } from './components/gripper';

export * from './components/inputcontroller';

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

export { type DataManager, DataManagerClient } from './services/data-manager';

export {
  type Mode,
  NavigationClient,
  type NavigationPosition,
  type NavigationProperties,
  type Path,
  type Waypoint,
} from './services/navigation';

export { type Servo, ServoClient } from './components/servo';

export { SlamClient, type SlamPosition, type SlamProperties } from './services/slam';

export {
  type Classification,
  type Detection,
  type PointCloudObject,
  VisionClient,
} from './services/vision';

export {
  type Generic as GenericService,
  GenericClient as GenericServiceClient,
} from './services/generic';

export * from './services/video';
export * from './services/world-state-store';

export { MachineConnectionEvent } from './events';

export * from './types';
export {
  addMetadata,
  deleteMetadata,
  disableDebugLogging,
  doCommandFromClient,
  enableDebugLogging,
  getStatusFromClient,
} from './utils';

export {
  createConsoleLogWriter,
  setDebugLogWriter,
  type DebugLogEntry,
  type DebugLogWriter,
} from './debug';
