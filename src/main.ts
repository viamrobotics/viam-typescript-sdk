export { version } from '../package.json';

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
  type DialDirectConf,
  type DialWebRTCConf,
  RobotClient,
  createRobotClient,
} from './robot';
/**
 * @deprecated Use {@link RobotClient} instead.
 * @group Clients
 */
export { RobotClient as Client } from './robot';

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
export { type Base, BaseClient } from './components/base';

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
export { type Board, BoardClient } from './components/board';

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
export { type Camera, CameraClient } from './components/camera';

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
  MovementSensorClient,
} from './components/movementsensor';

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
 * Raw Protobuf interfaces for a Gantry component.
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
 * const request = new gantryApi.GetLengthsRequest();
 * request.setName('mygantry');
 *
 * client.gantryService.getLengths(
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
export { default as gantryApi } from './gen/component/gantry/v1/gantry_pb';

/**
 * Raw Protobuf interfaces for a Generic component.
 *
 * Generated with https://github.com/improbable-eng/grpc-web
 *
 * @example
 *
 * ```ts
 * import { grpc } from '@improbable-eng/grpc-web';
 * import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
 *
 * const client = {}; // replace with a connected robot client
 *
 * const request = new genericApi.DoCommandRequest();
 * request.setName('mygeneric');
 * request.setCommand(Struct.fromJavaScript({ foo: 'bar' }));
 *
 * client.genericService.doCommand(
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
export { default as genericApi } from './gen/component/generic/v1/generic_pb';

/**
 * Raw Protobuf interfaces for a Gripper component.
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
 * const request = new gripperApi.IsMovingRequest();
 * request.setName('mygripper');
 *
 * client.gripperService.isMoving(
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
export { default as gripperApi } from './gen/component/gripper/v1/gripper_pb';

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
 * request.setName('myinput controller');
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
export { type Motion, MotionClient } from './services/motion';

/**
 * Raw Protobuf interfaces for a Navigation service.
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
 * const request = new navigationApi.GetWaypointsRequest();
 * request.setName('mynavigation');
 *
 * client.navigationService.getWaypoints(
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
export { default as navigationApi } from './gen/service/navigation/v1/navigation_pb';

/**
 * Raw Protobuf interfaces for a Servo component.
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
 * const request = new servoApi.GetPositionRequest();
 * request.setName('myservo');
 *
 * client.servoService.getPosition(
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
export { default as servoApi } from './gen/component/servo/v1/servo_pb';

/**
 * Raw Protobuf interfaces for a Slam service.
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
 * const request = new slamApi.GetPositionRequest();
 * request.setName('myslam');
 *
 * client.slamService.getPosition(
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
export { default as slamApi } from './gen/service/slam/v1/slam_pb';

/**
 * Raw Protobuf interfaces for a Vision service.
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
 * const request = new visionApi.GetDetectorNamesRequest();
 * request.setName('myvision');
 *
 * client.visionService.getDetectorNames(
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
export { default as visionApi } from './gen/service/vision/v1/vision_pb';

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
 * @privateRemarks
 * It doesn't matter which ServiceError we export.
 * @alpha
 * @group Raw Protobufs
 */
export type {
  ResponseStream,
  ServiceError,
} from './gen/robot/v1/robot_pb_service';

export * from './types';
