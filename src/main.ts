export { version } from '../package.json';

// Wrappers

export {
  type Robot,
  type DialDirectConf,
  type DialWebRTCConf,
  RobotClient,
  createRobotClient,
} from './robot';
export { RobotClient as Client } from './robot';

export { type Arm, ArmClient } from './components/arm';
export { type Base, BaseClient } from './components/base';
export { type Board, BoardClient } from './components/board';
export { type Camera, CameraClient } from './components/camera';
export { type Motor, MotorClient } from './components/motor';
export {
  type MovementSensor,
  MovementSensorClient,
} from './components/movementsensor';
export { type Sensor, SensorClient } from './components/sensor';
export { type Stream, StreamClient } from './extra/stream';

// Raw Protobufs

export { default as armApi } from './gen/component/arm/v1/arm_pb';
export { default as baseApi } from './gen/component/base/v1/base_pb';
export { default as boardApi } from './gen/component/board/v1/board_pb';
export { default as cameraApi } from './gen/component/camera/v1/camera_pb';
export { default as commonApi } from './gen/common/v1/common_pb';
export { default as gantryApi } from './gen/component/gantry/v1/gantry_pb';
export { default as genericApi } from './gen/component/generic/v1/generic_pb';
export { default as gripperApi } from './gen/component/gripper/v1/gripper_pb';
export { default as inputControllerApi } from './gen/component/inputcontroller/v1/input_controller_pb';
export { default as motionApi } from './gen/service/motion/v1/motion_pb';
export { default as motorApi } from './gen/component/motor/v1/motor_pb';
export { default as movementSensorApi } from './gen/component/movementsensor/v1/movementsensor_pb';
export { default as navigationApi } from './gen/service/navigation/v1/navigation_pb';
export { default as robotApi } from './gen/robot/v1/robot_pb';
export { default as sensorApi } from './gen/component/sensor/v1/sensor_pb';
export { default as sensorsApi } from './gen/service/sensors/v1/sensors_pb';
export { default as servoApi } from './gen/component/servo/v1/servo_pb';
export { default as slamApi } from './gen/service/slam/v1/slam_pb';
export { default as streamApi } from './gen/proto/stream/v1/stream_pb';
export { default as visionApi } from './gen/service/vision/v1/vision_pb';

// It doesn't matter which ServiceError we export really.
export type {
  ResponseStream,
  ServiceError,
} from './gen/robot/v1/robot_pb_service';
