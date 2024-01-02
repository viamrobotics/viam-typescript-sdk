/* eslint-disable max-classes-per-file */
import { backOff } from 'exponential-backoff';
import type { Credentials, DialOptions } from '@viamrobotics/rpc/src/dial';
import { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import { dialDirect, dialWebRTC } from '@viamrobotics/rpc';
import { grpc } from '@improbable-eng/grpc-web';
import { DISCONNECTED, EventDispatcher, events, RECONNECTED } from '../events';
import proto from '../gen/robot/v1/robot_pb';
import type {
  PoseInFrame,
  ResourceName,
  Transform,
} from '../gen/common/v1/common_pb';
import { encodeResourceName, promisify } from '../utils';
import { ArmServiceClient } from '../gen/component/arm/v1/arm_pb_service';
import { BaseServiceClient } from '../gen/component/base/v1/base_pb_service';
import { BoardServiceClient } from '../gen/component/board/v1/board_pb_service';
import { EncoderServiceClient } from '../gen/component/encoder/v1/encoder_pb_service';
import { GantryServiceClient } from '../gen/component/gantry/v1/gantry_pb_service';
import { GenericServiceClient } from '../gen/component/generic/v1/generic_pb_service';
import { GripperServiceClient } from '../gen/component/gripper/v1/gripper_pb_service';
import { InputControllerServiceClient } from '../gen/component/inputcontroller/v1/input_controller_pb_service';
import { MotionServiceClient } from '../gen/service/motion/v1/motion_pb_service';
import { MotorServiceClient } from '../gen/component/motor/v1/motor_pb_service';
import { MovementSensorServiceClient } from '../gen/component/movementsensor/v1/movementsensor_pb_service';
import { NavigationServiceClient } from '../gen/service/navigation/v1/navigation_pb_service';
import { PowerSensorServiceClient } from '../gen/component/powersensor/v1/powersensor_pb_service';
import { RobotServiceClient } from '../gen/robot/v1/robot_pb_service';
import type { Status } from '../gen/robot/v1/robot_pb_service';
import { SLAMServiceClient } from '../gen/service/slam/v1/slam_pb_service';
import { SensorsServiceClient } from '../gen/service/sensors/v1/sensors_pb_service';
import { ServoServiceClient } from '../gen/component/servo/v1/servo_pb_service';
import { VisionServiceClient } from '../gen/service/vision/v1/vision_pb_service';
import { ViamResponseStream } from '../responses';
import SessionManager from './session-manager';
import GRPCConnectionManager from './grpc-connection-manager';
import type { Robot, RobotStatusStream } from './robot';

interface WebRTCOptions {
  enabled: boolean;
  host: string;
  signalingAddress: string;
  rtcConfig: RTCConfiguration | undefined;
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
}

interface DirectOptions {
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
}

interface SessionOptions {
  disabled: boolean;
}

export interface ConnectOptions {
  authEntity?: string;
  creds?: Credentials;
  priority?: number;
}

abstract class ServiceClient {
  constructor(
    public serviceHost: string,
    public options?: grpc.RpcOptions
  ) {}
}

/**
 * A gRPC-web client for a Robot.
 *
 * @group Clients
 */
export class RobotClient extends EventDispatcher implements Robot {
  private readonly serviceHost: string;
  private readonly webrtcOptions: WebRTCOptions | undefined;
  private readonly directOptions: DirectOptions | undefined;
  private readonly sessionOptions: SessionOptions | undefined;
  private gRPCConnectionManager: GRPCConnectionManager;
  private sessionManager: SessionManager;

  private peerConn: RTCPeerConnection | undefined;

  private transportFactory: grpc.TransportFactory | undefined;

  private connecting: Promise<void> | undefined;

  private connectResolve: (() => void) | undefined;

  private savedAuthEntity: string | undefined;

  private savedCreds: Credentials | undefined;

  private robotServiceClient: RobotServiceClient | undefined;

  private armServiceClient: ArmServiceClient | undefined;

  private baseServiceClient: BaseServiceClient | undefined;

  private boardServiceClient: BoardServiceClient | undefined;

  private encoderServiceClient: EncoderServiceClient | undefined;

  private gantryServiceClient: GantryServiceClient | undefined;

  private genericServiceClient: GenericServiceClient | undefined;

  private gripperServiceClient: GripperServiceClient | undefined;

  private movementSensorServiceClient: MovementSensorServiceClient | undefined;

  private powerSensorServiceClient: PowerSensorServiceClient | undefined;

  private inputControllerServiceClient:
    | InputControllerServiceClient
    | undefined;

  private motorServiceClient: MotorServiceClient | undefined;

  private navigationServiceClient: NavigationServiceClient | undefined;

  private motionServiceClient: MotionServiceClient | undefined;

  private visionServiceClient: VisionServiceClient | undefined;

  private sensorsServiceClient: SensorsServiceClient | undefined;

  private servoServiceClient: ServoServiceClient | undefined;

  private slamServiceClient: SLAMServiceClient | undefined;

  constructor(
    serviceHost: string,
    webrtcOptions?: WebRTCOptions,
    sessionOptions?: SessionOptions,
    directOptions?: DirectOptions
  ) {
    super();
    this.serviceHost = serviceHost;
    this.webrtcOptions = webrtcOptions;
    this.directOptions = directOptions;
    this.sessionOptions = sessionOptions;
    this.gRPCConnectionManager = new GRPCConnectionManager(
      serviceHost,
      (opts: grpc.TransportOptions): grpc.Transport => {
        if (!this.transportFactory) {
          throw new Error(RobotClient.notConnectedYetStr);
        }
        return this.transportFactory(opts);
      }
    );
    this.sessionManager = new SessionManager(
      serviceHost,
      (opts: grpc.TransportOptions): grpc.Transport => {
        if (!this.transportFactory) {
          throw new Error(RobotClient.notConnectedYetStr);
        }
        return this.transportFactory(opts);
      }
    );

    events.on(RECONNECTED, () => {
      this.emit(RECONNECTED, {});
    });
    events.on(DISCONNECTED, () => {
      this.emit(DISCONNECTED, {});
      if (this.noReconnect) {
        return;
      }

      let retries = 0;
      // eslint-disable-next-line no-console
      console.debug('connection closed, will try to reconnect');
      void backOff(
        async () =>
          this.connect().then(
            () => {
              // eslint-disable-next-line no-console
              console.debug('reconnected successfully!');
              events.emit(RECONNECTED, {});
            },
            (error) => {
              // eslint-disable-next-line no-console
              console.debug(`failed to reconnect - retries count: ${retries}`);
              retries += 1;
              if (retries === this.reconnectMaxAttempts) {
                console.debug(
                  `reached max attempts: ${this.reconnectMaxAttempts}`
                );
              }
              throw error;
            }
          ),
        {
          // default values taken from `exponential-backoff` library
          maxDelay: this.reconnectMaxWait ?? Number.POSITIVE_INFINITY,
          numOfAttempts: this.reconnectMaxAttempts ?? 10,
        }
      );
    });
  }

  private get noReconnect() {
    return this.webrtcOptions?.noReconnect ?? this.directOptions?.noReconnect;
  }

  private get reconnectMaxAttempts() {
    return (
      this.webrtcOptions?.reconnectMaxAttempts ??
      this.directOptions?.reconnectMaxAttempts
    );
  }

  private get reconnectMaxWait() {
    return (
      this.webrtcOptions?.reconnectMaxWait ??
      this.directOptions?.reconnectMaxWait
    );
  }

  get sessionId() {
    return this.sessionManager.sessionID;
  }

  private static readonly notConnectedYetStr = 'not connected yet';

  get robotService() {
    if (!this.robotServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.robotServiceClient;
  }

  get armService() {
    if (!this.armServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.armServiceClient;
  }

  get baseService() {
    if (!this.baseServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.baseServiceClient;
  }

  get boardService() {
    if (!this.boardServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.boardServiceClient;
  }

  get encoderService() {
    if (!this.encoderServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.encoderServiceClient;
  }

  get gantryService() {
    if (!this.gantryServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.gantryServiceClient;
  }

  get genericService() {
    if (!this.genericServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.genericServiceClient;
  }

  get gripperService() {
    if (!this.gripperServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.gripperServiceClient;
  }

  get movementSensorService() {
    if (!this.movementSensorServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.movementSensorServiceClient;
  }

  get powerSensorService() {
    if (!this.powerSensorServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.powerSensorServiceClient;
  }

  get inputControllerService() {
    if (!this.inputControllerServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.inputControllerServiceClient;
  }

  get motorService() {
    if (!this.motorServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.motorServiceClient;
  }

  get navigationService() {
    if (!this.navigationServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.navigationServiceClient;
  }

  get motionService() {
    if (!this.motionServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.motionServiceClient;
  }

  get visionService() {
    if (!this.visionServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.visionServiceClient;
  }

  get sensorsService() {
    if (!this.sensorsServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.sensorsServiceClient;
  }

  get servoService() {
    if (!this.servoServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.servoServiceClient;
  }

  get slamService() {
    if (!this.slamServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.slamServiceClient;
  }

  createServiceClient<T extends ServiceClient>(
    SC: new (serviceHost: string, options?: grpc.RpcOptions) => T
  ): T {
    const clientTransportFactory = this.sessionOptions?.disabled
      ? this.transportFactory
      : this.sessionManager.transportFactory;

    if (!clientTransportFactory) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    const grpcOptions = { transport: clientTransportFactory };
    return new SC(this.serviceHost, grpcOptions);
  }

  get peerConnection() {
    return this.peerConn;
  }

  public async disconnect() {
    while (this.connecting) {
      // eslint-disable-next-line no-await-in-loop
      await this.connecting;
    }

    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = undefined;
    }
    this.sessionManager.reset();
  }

  public isConnected(): boolean {
    return this.peerConn?.iceConnectionState === 'connected';
  }

  public async connect({
    authEntity = this.savedAuthEntity,
    creds = this.savedCreds,
    priority,
  }: ConnectOptions = {}) {
    if (this.connecting) {
      // This lint is clearly wrong due to how the event loop works such that after an await, the condition may no longer be true.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (this.connecting) {
        // eslint-disable-next-line no-await-in-loop
        await this.connecting;
      }
      return;
    }
    this.connecting = new Promise<void>((resolve) => {
      this.connectResolve = resolve;
    });

    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = undefined;
    }

    /*
     * TODO(RSDK-887): no longer reset if we are reusing authentication material; otherwise our session
     * and authentication context will no longer match.
     */
    this.sessionManager.reset();

    try {
      const opts: DialOptions = {
        authEntity,
        credentials: creds,
        webrtcOptions: {
          disableTrickleICE: false,
          rtcConfig: this.webrtcOptions?.rtcConfig,
        },
      };

      // Webrtcoptions will always be defined, but TS doesn't know this
      if (priority !== undefined && opts.webrtcOptions) {
        opts.webrtcOptions.additionalSdpFields = { 'x-priority': priority };
      }

      // Save authEntity, creds
      this.savedAuthEntity = authEntity;
      this.savedCreds = creds;

      if (this.webrtcOptions?.enabled) {
        // This should not have to be checked but tsc can't tell the difference...
        if (opts.webrtcOptions) {
          opts.webrtcOptions.signalingAuthEntity = opts.authEntity;
          opts.webrtcOptions.signalingCredentials = opts.credentials;
        }

        const webRTCConn = await dialWebRTC(
          this.webrtcOptions.signalingAddress || this.serviceHost,
          this.webrtcOptions.host,
          opts
        );

        /*
         * Lint disabled because we know that we are the only code to
         * read and then write to 'peerConn', even after we have awaited/paused.
         */
        this.peerConn = webRTCConn.peerConnection; // eslint-disable-line require-atomic-updates
        this.peerConn.addEventListener('iceconnectionstatechange', () => {
          /*
           * TODO: are there any disconnection scenarios where we can reuse the
           * same connection and restart ice?
           *
           * All connection loss scenarios I tested seem to result in the peer
           * connection getting closed, so restarting ice is not a valid way to
           * recover.
           */
          if (this.peerConn?.iceConnectionState === 'connected') {
            events.emit(RECONNECTED, {});
          } else if (this.peerConn?.iceConnectionState === 'closed') {
            events.emit(DISCONNECTED, {});
          }
        });

        this.transportFactory = webRTCConn.transportFactory;

        webRTCConn.peerConnection.ontrack = (event) => {
          const [eventStream] = event.streams;
          if (!eventStream) {
            events.emit('track', event);
            throw new Error('expected event stream to exist');
          }

          /*
           * Track id has +s to conform to RFC 4566 (https://www.rfc-editor.org/rfc/rfc4566)
           * where names should not contain colons.
           */
          const resName = eventStream.id.replaceAll('+', ':');
          // Overriding the stream id to match the resource name
          Object.defineProperty(eventStream, 'id', {
            value: resName,
          });
          events.emit('track', event);
        };
      } else {
        this.transportFactory = await dialDirect(this.serviceHost, opts);
        await this.gRPCConnectionManager.start();
      }

      const clientTransportFactory = this.sessionOptions?.disabled
        ? this.transportFactory
        : this.sessionManager.transportFactory;
      const grpcOptions = { transport: clientTransportFactory };

      this.robotServiceClient = new RobotServiceClient(
        this.serviceHost,
        grpcOptions
      );
      // eslint-disable-next-line no-warning-comments
      // TODO(RSDK-144): these should be created as needed
      this.armServiceClient = new ArmServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.baseServiceClient = new BaseServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.boardServiceClient = new BoardServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.encoderServiceClient = new EncoderServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.gantryServiceClient = new GantryServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.genericServiceClient = new GenericServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.gripperServiceClient = new GripperServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.movementSensorServiceClient = new MovementSensorServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.powerSensorServiceClient = new PowerSensorServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.inputControllerServiceClient = new InputControllerServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.motorServiceClient = new MotorServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.navigationServiceClient = new NavigationServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.motionServiceClient = new MotionServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.visionServiceClient = new VisionServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.sensorsServiceClient = new SensorsServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.servoServiceClient = new ServoServiceClient(
        this.serviceHost,
        grpcOptions
      );
      this.slamServiceClient = new SLAMServiceClient(
        this.serviceHost,
        grpcOptions
      );
    } finally {
      this.connectResolve?.();
      this.connectResolve = undefined;

      /*
       * Lint disabled because we know that we are the only code to
       * read and then write to 'connecting', even after we have awaited/paused.
       */
      this.connecting = undefined; // eslint-disable-line require-atomic-updates
    }
  }

  // OPERATIONS

  async getOperations() {
    const { robotService } = this;
    const request = new proto.GetOperationsRequest();
    const response = await promisify<
      proto.GetOperationsRequest,
      proto.GetOperationsResponse
    >(robotService.getOperations.bind(robotService), request);
    return response.getOperationsList();
  }

  async cancelOperation(id: string) {
    const { robotService } = this;
    const request = new proto.CancelOperationRequest();
    request.setId(id);
    await promisify<
      proto.CancelOperationRequest,
      proto.CancelOperationResponse
    >(robotService.cancelOperation.bind(robotService), request);
  }

  async blockForOperation(id: string) {
    const { robotService } = this;
    const request = new proto.BlockForOperationRequest();
    request.setId(id);
    await promisify<
      proto.BlockForOperationRequest,
      proto.BlockForOperationResponse
    >(robotService.blockForOperation.bind(robotService), request);
  }

  async stopAll() {
    const { robotService } = this;
    const request = new proto.StopAllRequest();
    await promisify<proto.StopAllRequest, proto.StopAllResponse>(
      robotService.stopAll.bind(robotService),
      request
    );
  }

  // FRAME SYSTEM

  async frameSystemConfig(transforms: Transform[]) {
    const { robotService } = this;
    const request = new proto.FrameSystemConfigRequest();
    request.setSupplementalTransformsList(transforms);
    const response = await promisify<
      proto.FrameSystemConfigRequest,
      proto.FrameSystemConfigResponse
    >(robotService.frameSystemConfig.bind(robotService), request);
    return response.getFrameSystemConfigsList();
  }

  async transformPose(
    source: PoseInFrame,
    destination: string,
    supplementalTransforms: Transform[]
  ) {
    const { robotService } = this;
    const request = new proto.TransformPoseRequest();
    request.setSource(source);
    request.setDestination(destination);
    request.setSupplementalTransformsList(supplementalTransforms);
    const response = await promisify<
      proto.TransformPoseRequest,
      proto.TransformPoseResponse
    >(robotService.transformPose.bind(robotService), request);
    const result = response.getPose();
    if (!result) {
      // eslint-disable-next-line no-warning-comments
      // TODO: Can the response frame be undefined or null?
      throw new Error('no pose');
    }
    return result;
  }

  async transformPCD(
    pointCloudPCD: Uint8Array,
    source: string,
    destination: string
  ) {
    const { robotService } = this;
    const request = new proto.TransformPCDRequest();
    request.setPointCloudPcd(pointCloudPCD);
    request.setSource(source);
    request.setDestination(destination);
    const response = await promisify<
      proto.TransformPCDRequest,
      proto.TransformPCDResponse
    >(robotService.transformPCD.bind(robotService), request);
    return response.getPointCloudPcd_asU8();
  }

  // DISCOVERY

  async discoverComponents(queries: proto.DiscoveryQuery[]) {
    const { robotService } = this;
    const request = new proto.DiscoverComponentsRequest();
    request.setQueriesList(queries);
    const response = await promisify<
      proto.DiscoverComponentsRequest,
      proto.DiscoverComponentsResponse
    >(robotService.discoverComponents.bind(robotService), request);
    return response.getDiscoveryList();
  }

  // RESOURCES

  async resourceNames() {
    const { robotService } = this;
    const request = new proto.ResourceNamesRequest();
    const response = await promisify<
      proto.ResourceNamesRequest,
      proto.ResourceNamesResponse
    >(robotService.resourceNames.bind(robotService), request);
    return response.getResourcesList().map((r) => r.toObject());
  }

  async resourceRPCSubtypes() {
    const { robotService } = this;
    const request = new proto.ResourceRPCSubtypesRequest();
    const response = await promisify<
      proto.ResourceRPCSubtypesRequest,
      proto.ResourceRPCSubtypesResponse
    >(robotService.resourceRPCSubtypes.bind(robotService), request);
    return response.getResourceRpcSubtypesList();
  }

  // STATUS

  async getStatus(resourceNames: ResourceName.AsObject[] = []) {
    const { robotService } = this;
    const request = new proto.GetStatusRequest();
    const encodedNames = resourceNames.map((rName) =>
      encodeResourceName(rName)
    );
    request.setResourceNamesList(encodedNames);
    const response = await promisify<
      proto.GetStatusRequest,
      proto.GetStatusResponse
    >(robotService.getStatus.bind(robotService), request);
    return response.getStatusList();
  }

  streamStatus(
    resourceNames: ResourceName.AsObject[] = [],
    durationMs = 500
  ): RobotStatusStream {
    const { robotService } = this;
    const request = new proto.StreamStatusRequest();
    const encodedNames = resourceNames.map((rName) =>
      encodeResourceName(rName)
    );
    request.setResourceNamesList(encodedNames);
    request.setEvery(new Duration().setNanos(durationMs * 1e6));

    const statusStream = robotService.streamStatus(request);
    const stream = new ViamResponseStream<proto.Status[]>(statusStream);
    statusStream.on('data', (response: proto.StreamStatusResponse) => {
      stream.emit('data', response.getStatusList());
    });
    statusStream.on('status', (status: Status) => {
      stream.emit('status', status);
    });
    statusStream.on('end', (status?: Status) => {
      stream.emit('end', status);
    });
    return stream;
  }
}
