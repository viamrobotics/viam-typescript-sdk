import * as Camera from './components/camera/Camera'
import { CameraClient } from './components/camera/Client'
import Client from './Client'

// eslint-disable-next-line no-warning-comments
// TODO(RSDK-1017): remove this export once RDK stops using it directly
import { RobotService } from './gen/robot/v1/robot_pb_service.esm'

import armApi from './gen/component/arm/v1/arm_pb.esm'
import baseApi from './gen/component/base/v1/base_pb.esm'
import boardApi from './gen/component/board/v1/board_pb.esm'
import cameraApi from './gen/component/camera/v1/camera_pb.esm'
import commonApi from './gen/common/v1/common_pb.esm'
import gantryApi from './gen/component/gantry/v1/gantry_pb.esm'
import genericApi from './gen/component/generic/v1/generic_pb.esm'
import gripperApi from './gen/component/gripper/v1/gripper_pb.esm'
import inputControllerApi from './gen/component/inputcontroller/v1/input_controller_pb.esm'
import motionApi from './gen/service/motion/v1/motion_pb.esm'
import motorApi from './gen/component/motor/v1/motor_pb.esm'
import movementSensorApi from './gen/component/movementsensor/v1/movementsensor_pb.esm'
import navigationApi from './gen/service/navigation/v1/navigation_pb.esm'
import robotApi from './gen/robot/v1/robot_pb.esm'
import sensorsApi from './gen/service/sensors/v1/sensors_pb.esm'
import servoApi from './gen/component/servo/v1/servo_pb.esm'
import slamApi from './gen/service/slam/v1/slam_pb.esm'
import streamApi from './gen/proto/stream/v1/stream_pb.esm'
import visionApi from './gen/service/vision/v1/vision_pb.esm'

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
  robotApi,
  navigationApi,
  sensorsApi,
  slamApi,
  visionApi,
  streamApi,
  Camera,
  CameraClient,
  Client,
  RobotService
}

// It doesn't matter which ServiceError we export really.
export type {
  ResponseStream,
  ServiceError
} from './gen/robot/v1/robot_pb_service.esm'
