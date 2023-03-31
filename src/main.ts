import { RobotClient as Client } from './robot';

import armApi from './gen/component/arm/v1/arm_pb';
import baseApi from './gen/component/base/v1/base_pb';
import boardApi from './gen/component/board/v1/board_pb';
import cameraApi from './gen/component/camera/v1/camera_pb';
import commonApi from './gen/common/v1/common_pb';
import gantryApi from './gen/component/gantry/v1/gantry_pb';
import genericApi from './gen/component/generic/v1/generic_pb';
import gripperApi from './gen/component/gripper/v1/gripper_pb';
import inputControllerApi from './gen/component/inputcontroller/v1/input_controller_pb';
import motionApi from './gen/service/motion/v1/motion_pb';
import motorApi from './gen/component/motor/v1/motor_pb';
import movementSensorApi from './gen/component/movementsensor/v1/movementsensor_pb';
import navigationApi from './gen/service/navigation/v1/navigation_pb';
import robotApi from './gen/robot/v1/robot_pb';
import sensorApi from './gen/component/sensor/v1/sensor_pb';
import sensorsApi from './gen/service/sensors/v1/sensors_pb';
import servoApi from './gen/component/servo/v1/servo_pb';
import slamApi from './gen/service/slam/v1/slam_pb';
import streamApi from './gen/proto/stream/v1/stream_pb';
import visionApi from './gen/service/vision/v1/vision_pb';

export {
  type Robot,
  type DialDirectConf,
  type DialWebRTCConf,
  RobotClient,
  createRobotClient,
} from './robot';
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

export {
  commonApi,
  armApi,
  baseApi,
  boardApi,
  cameraApi,
  gantryApi,
  genericApi,
  gripperApi,
  inputControllerApi,
  motorApi,
  motionApi,
  movementSensorApi,
  servoApi,
  navigationApi,
  robotApi,
  sensorApi,
  sensorsApi,
  slamApi,
  visionApi,
  streamApi,
  Client,
};

// It doesn't matter which ServiceError we export really.
export type {
  ResponseStream,
  ServiceError,
} from './gen/robot/v1/robot_pb_service';
