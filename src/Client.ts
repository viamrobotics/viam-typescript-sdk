/* eslint-disable max-classes-per-file */
import type { Credentials, DialOptions } from '@viamrobotics/rpc/src/dial'
import { dialDirect, dialWebRTC } from '@viamrobotics/rpc'
import { ArmServiceClient } from './gen/component/arm/v1/arm_pb_service.esm'
import { BaseServiceClient } from './gen/component/base/v1/base_pb_service.esm'
import { BoardServiceClient } from './gen/component/board/v1/board_pb_service.esm'
import { GantryServiceClient } from './gen/component/gantry/v1/gantry_pb_service.esm'
import { GenericServiceClient } from './gen/component/generic/v1/generic_pb_service.esm'
import { GripperServiceClient } from './gen/component/gripper/v1/gripper_pb_service.esm'
import { InputControllerServiceClient } from './gen/component/inputcontroller/v1/input_controller_pb_service.esm'
import { MotionServiceClient } from './gen/service/motion/v1/motion_pb_service.esm'
import { MotorServiceClient } from './gen/component/motor/v1/motor_pb_service.esm'
import { MovementSensorServiceClient } from './gen/component/movementsensor/v1/movementsensor_pb_service.esm'
import { NavigationServiceClient } from './gen/service/navigation/v1/navigation_pb_service.esm'
import { RobotServiceClient } from './gen/robot/v1/robot_pb_service.esm'
import { SLAMServiceClient } from './gen/service/slam/v1/slam_pb_service.esm'
import { SensorsServiceClient } from './gen/service/sensors/v1/sensors_pb_service.esm'
import { ServoServiceClient } from './gen/component/servo/v1/servo_pb_service.esm'
import SessionManager from './SessionManager'
import { VisionServiceClient } from './gen/service/vision/v1/vision_pb_service.esm'
import type { grpc } from '@improbable-eng/grpc-web'

interface WebRTCOptions {
  enabled: boolean
  host: string
  signalingAddress: string
  rtcConfig: RTCConfiguration | undefined
}

interface SessionOptions {
  disabled: boolean
}

abstract class ServiceClient {
  constructor(public serviceHost: string, public options?: grpc.RpcOptions) {}
}

export default class Client {
  private readonly serviceHost: string
  private readonly webrtcOptions: WebRTCOptions | undefined
  private readonly sessionOptions: SessionOptions | undefined
  private sessionManager: SessionManager

  private peerConn: RTCPeerConnection | undefined

  private transportFactory: grpc.TransportFactory | undefined

  private connecting: Promise<void> | undefined

  private connectResolve: (() => void) | undefined

  private savedAuthEntity: string | undefined

  private savedCreds: Credentials | undefined

  private robotServiceClient: RobotServiceClient | undefined

  private armServiceClient: ArmServiceClient | undefined

  private baseServiceClient: BaseServiceClient | undefined

  private boardServiceClient: BoardServiceClient | undefined

  private gantryServiceClient: GantryServiceClient | undefined

  private genericServiceClient: GenericServiceClient | undefined

  private gripperServiceClient: GripperServiceClient | undefined

  private movementSensorServiceClient: MovementSensorServiceClient | undefined

  private inputControllerServiceClient: InputControllerServiceClient | undefined

  private motorServiceClient: MotorServiceClient | undefined

  private navigationServiceClient: NavigationServiceClient | undefined

  private motionServiceClient: MotionServiceClient | undefined

  private visionServiceClient: VisionServiceClient | undefined

  private sensorsServiceClient: SensorsServiceClient | undefined

  private servoServiceClient: ServoServiceClient | undefined

  private slamServiceClient: SLAMServiceClient | undefined

  constructor(
    serviceHost: string,
    webrtcOptions?: WebRTCOptions,
    sessionOptions?: SessionOptions
  ) {
    this.serviceHost = serviceHost
    this.webrtcOptions = webrtcOptions
    this.sessionOptions = sessionOptions
    this.sessionManager = new SessionManager(
      serviceHost,
      (opts: grpc.TransportOptions): grpc.Transport => {
        if (!this.transportFactory) {
          throw new Error(Client.notConnectedYetStr)
        }
        return this.transportFactory(opts)
      }
    )
  }

  get sessionId() {
    return this.sessionManager.sessionID
  }

  private static readonly notConnectedYetStr = 'not connected yet'

  get robotService() {
    if (!this.robotServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.robotServiceClient
  }

  get armService() {
    if (!this.armServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.armServiceClient
  }

  get baseService() {
    if (!this.baseServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.baseServiceClient
  }

  get boardService() {
    if (!this.boardServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.boardServiceClient
  }

  get gantryService() {
    if (!this.gantryServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.gantryServiceClient
  }

  get genericService() {
    if (!this.genericServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.genericServiceClient
  }

  get gripperService() {
    if (!this.gripperServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.gripperServiceClient
  }

  get movementSensorService() {
    if (!this.movementSensorServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.movementSensorServiceClient
  }

  get inputControllerService() {
    if (!this.inputControllerServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.inputControllerServiceClient
  }

  get motorService() {
    if (!this.motorServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.motorServiceClient
  }

  get navigationService() {
    if (!this.navigationServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.navigationServiceClient
  }

  get motionService() {
    if (!this.motionServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.motionServiceClient
  }

  get visionService() {
    if (!this.visionServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.visionServiceClient
  }

  get sensorsService() {
    if (!this.sensorsServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.sensorsServiceClient
  }

  get servoService() {
    if (!this.servoServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.servoServiceClient
  }

  get slamService() {
    if (!this.slamServiceClient) {
      throw new Error(Client.notConnectedYetStr)
    }
    return this.slamServiceClient
  }

  createServiceClient<T extends ServiceClient>(
    SC: new (serviceHost: string, options?: grpc.RpcOptions) => T
  ): T {
    const clientTransportFactory = this.sessionOptions?.disabled
      ? this.transportFactory
      : this.sessionManager.transportFactory

    if (!clientTransportFactory) {
      throw new Error(Client.notConnectedYetStr)
    }
    const grpcOptions = { transport: clientTransportFactory }
    return new SC(this.serviceHost, grpcOptions)
  }

  public async disconnect() {
    while (this.connecting) {
      // eslint-disable-next-line no-await-in-loop
      await this.connecting
    }

    if (this.peerConn) {
      this.peerConn.close()
      this.peerConn = undefined
    }
    this.sessionManager.reset()
  }

  public async connect(
    authEntity = this.savedAuthEntity,
    creds = this.savedCreds
  ) {
    if (this.connecting) {
      // This lint is clearly wrong due to how the event loop works such that after an await, the condition may no longer be true.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (this.connecting) {
        // eslint-disable-next-line no-await-in-loop
        await this.connecting
      }
      return
    }
    this.connecting = new Promise<void>((resolve) => {
      this.connectResolve = resolve
    })

    if (this.peerConn) {
      this.peerConn.close()
      this.peerConn = undefined
    }

    /*
     * TODO(RSDK-887): no longer reset if we are reusing authentication material; otherwise our session
     * and authentication context will no longer match.
     */
    this.sessionManager.reset()

    try {
      const opts: DialOptions = {
        authEntity,
        credentials: creds,
        webrtcOptions: {
          disableTrickleICE: false,
          rtcConfig: this.webrtcOptions?.rtcConfig,
        },
      }

      // Save authEntity, creds
      this.savedAuthEntity = authEntity
      this.savedCreds = creds

      if (this.webrtcOptions?.enabled) {
        // This should not have to be checked but tsc can't tell the difference...
        if (opts.webrtcOptions) {
          opts.webrtcOptions.signalingAuthEntity = opts.authEntity
          opts.webrtcOptions.signalingCredentials = opts.credentials
        }

        const webRTCConn = await dialWebRTC(
          this.webrtcOptions.signalingAddress || this.serviceHost,
          this.webrtcOptions.host,
          opts
        )

        /*
         * Lint disabled because we know that we are the only code to
         * read and then write to 'peerConn', even after we have awaited/paused.
         */
        this.peerConn = webRTCConn.peerConnection // eslint-disable-line require-atomic-updates
        this.transportFactory = webRTCConn.transportFactory

        webRTCConn.peerConnection.ontrack = (event) => {
          const { kind } = event.track

          const eventStream = event.streams[0]
          if (!eventStream) {
            throw new Error('expected event stream to exist')
          }
          const streamName = eventStream.id
          const streamContainers = document.querySelectorAll(
            `[data-stream="${streamName}"]`
          )

          for (const streamContainer of streamContainers) {
            const mediaElement = document.createElement(kind) as
              | HTMLAudioElement
              | HTMLVideoElement
            mediaElement.srcObject = eventStream
            mediaElement.autoplay = true
            if (mediaElement instanceof HTMLVideoElement) {
              mediaElement.playsInline = true
              mediaElement.controls = false
            } else {
              mediaElement.controls = true
            }

            const child = streamContainer.querySelector(kind)
            child?.remove()
            streamContainer.append(mediaElement)
          }

          const streamPreviewContainers = document.querySelectorAll(
            `[data-stream-preview="${streamName}"]`
          )
          for (const streamContainer of streamPreviewContainers) {
            const mediaElementPreview = document.createElement(kind) as
              | HTMLAudioElement
              | HTMLVideoElement
            mediaElementPreview.srcObject = eventStream
            mediaElementPreview.autoplay = true
            if (mediaElementPreview instanceof HTMLVideoElement) {
              mediaElementPreview.playsInline = true
              mediaElementPreview.controls = false
            } else {
              mediaElementPreview.controls = true
            }
            const child = streamContainer.querySelector(kind)
            child?.remove()
            streamContainer.append(mediaElementPreview)
          }
        }
      } else {
        this.transportFactory = await dialDirect(this.serviceHost, opts)
      }

      const clientTransportFactory = this.sessionOptions?.disabled
        ? this.transportFactory
        : this.sessionManager.transportFactory
      const grpcOptions = { transport: clientTransportFactory }

      this.robotServiceClient = new RobotServiceClient(
        this.serviceHost,
        grpcOptions
      )
      // eslint-disable-next-line no-warning-comments
      // TODO(RSDK-144): these should be created as needed
      this.armServiceClient = new ArmServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.baseServiceClient = new BaseServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.boardServiceClient = new BoardServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.gantryServiceClient = new GantryServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.genericServiceClient = new GenericServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.gripperServiceClient = new GripperServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.movementSensorServiceClient = new MovementSensorServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.inputControllerServiceClient = new InputControllerServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.motorServiceClient = new MotorServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.navigationServiceClient = new NavigationServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.motionServiceClient = new MotionServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.visionServiceClient = new VisionServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.sensorsServiceClient = new SensorsServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.servoServiceClient = new ServoServiceClient(
        this.serviceHost,
        grpcOptions
      )
      this.slamServiceClient = new SLAMServiceClient(
        this.serviceHost,
        grpcOptions
      )
    } finally {
      this.connectResolve?.()
      this.connectResolve = undefined

      /*
       * Lint disabled because we know that we are the only code to
       * read and then write to 'connecting', even after we have awaited/paused.
       */
      this.connecting = undefined // eslint-disable-line require-atomic-updates
    }
  }
}
