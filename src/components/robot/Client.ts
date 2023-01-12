import type Client from '../../Client'
import type { DiscoveryQuery } from '../../gen/robot/v1/robot_pb.esm'
import type { Duration } from 'google-protobuf/google/protobuf/duration_pb'
import type { Robot } from './Robot'
import { RobotServiceClient } from '../../gen/robot/v1/robot_pb_service.esm'

import type { commonApi } from '../../main'
import { promisify } from '../../utils'
// eslint-disable-next-line no-duplicate-imports
import { robotApi } from '../../main'


export class RobotClient implements Robot {
  private client: RobotServiceClient
  private name: string

  constructor (client: Client, name: string) {
    this.client = client.createServiceClient(RobotServiceClient)
    this.name = name
  }

  private get robotService () {
    return this.client
  }

  async getOperations () {
    const robotService = this.robotService
    const request = new robotApi.GetOperationsRequest()
    const response = await promisify<robotApi.GetOperationsRequest, robotApi.GetOperationsResponse>(
      robotService.getOperations.bind(robotService),
      request
    )
    return response
  }
  async getSessions () {
    const robotService = this.robotService
    const request = new robotApi.GetSessionsRequest()
    const response = await promisify<robotApi.GetSessionsRequest, robotApi.GetSessionsResponse>(
      robotService.getSessions.bind(robotService),
      request
    )
    return response
  }
  async resourceNames () {
    const robotService = this.robotService
    const request = new robotApi.ResourceNamesRequest()
    const response = await promisify<robotApi.ResourceNamesRequest, robotApi.ResourceNamesResponse>(
      robotService.resourceNames.bind(robotService),
      request
    )
    return response
  }
  async resourceRPCSubtypes () {
    const robotService = this.robotService
    const request = new robotApi.ResourceRPCSubtypesRequest()
    const response = await promisify<robotApi.ResourceRPCSubtypesRequest, robotApi.ResourceRPCSubtypesResponse>(
      robotService.resourceRPCSubtypes.bind(robotService),
      request
    )
    return response
  }
  async cancelOperation (id: string) {
    const robotService = this.robotService
    const request = new robotApi.CancelOperationRequest()
    request.setId(id)
    const response = await promisify<robotApi.CancelOperationRequest, robotApi.CancelOperationResponse>(
      robotService.cancelOperation.bind(robotService),
      request
    )
    return response
  }
  async blockForOperation (id: string) {
    const robotService = this.robotService
    const request = new robotApi.BlockForOperationRequest()
    request.setId(id)
    const response = await promisify<robotApi.BlockForOperationRequest, robotApi.BlockForOperationResponse>(
      robotService.blockForOperation.bind(robotService),
      request
    )
    return response
  }
  async discoverComponents (queries: DiscoveryQuery[]) {
    const robotService = this.robotService
    const request = new robotApi.DiscoverComponentsRequest()
    request.setQueriesList(queries)
    const response = await promisify<robotApi.DiscoverComponentsRequest, robotApi.DiscoverComponentsResponse>(
      robotService.discoverComponents.bind(robotService),
      request
    )
    return response
  }

  async frameSystemConfig (transforms: commonApi.Transform[]) {
    const robotService = this.robotService
    const request = new robotApi.FrameSystemConfigRequest()
    request.setSupplementalTransformsList(transforms)
    const response = await promisify<robotApi.FrameSystemConfigRequest, robotApi.FrameSystemConfigResponse>(
      robotService.frameSystemConfig.bind(robotService),
      request
    )
    return response
  }
  async transformPose (source: commonApi.PoseInFrame, destination: string, supplementalTransforms: commonApi.Transform[]) {
    const robotService = this.robotService
    const request = new robotApi.TransformPoseRequest()
    request.setSource(source)
    request.setDestination(destination)
    request.setSupplementalTransformsList(supplementalTransforms)
    const response = await promisify<robotApi.TransformPoseRequest, robotApi.TransformPoseResponse>(
      robotService.transformPose.bind(robotService),
      request
    )
    return response
  }
  async transformPCD (pointCloudPcd: Uint8Array, source: string, destination: string) {
    const robotService = this.robotService
    const request = new robotApi.TransformPCDRequest()
    request.setPointCloudPcd(pointCloudPcd)
    request.setSource(source)
    request.setDestination(destination)
    const response = await promisify<robotApi.TransformPCDRequest, robotApi.TransformPCDResponse>(
      robotService.transformPCD.bind(robotService),
      request
    )
    return response
  }
  async getStatus (resourceNames: commonApi.ResourceName[]) {
    const robotService = this.robotService
    const request = new robotApi.GetStatusRequest()
    request.setResourceNamesList(resourceNames)
    const response = await promisify<robotApi.GetStatusRequest, robotApi.GetStatusResponse>(
      robotService.getStatus.bind(robotService),
      request
    )
    return response
  }
  async streamStatus (resourceNames: commonApi.ResourceName[], duration: Duration) {
    const robotService = this.robotService
    const request = new robotApi.StreamStatusRequest()
    request.setResourceNamesList(resourceNames)
    request.setEvery(duration)
    const response = await promisify<robotApi.StreamStatusRequest, robotApi.StreamStatusResponse>(
      robotService.streamStatus.bind(robotService),
      request
    )
    return response
  }
  async stopAll () {
    const robotService = this.robotService
    const request = new robotApi.StopAllRequest()
    const response = await promisify<robotApi.StopAllRequest, robotApi.StopAllResponse>(
      robotService.stopAll.bind(robotService),
      request
    )
    return response
  }
  async startSession (resume: string) {
    const robotService = this.robotService
    const request = new robotApi.StartSessionRequest()
    request.setResume(resume)
    const response = await promisify<robotApi.StartSessionRequest, robotApi.StartSessionResponse>(
      robotService.startSession.bind(robotService),
      request
    )
    return response
  }
  async sendSessionHeartbeat (id: string) {
    const robotService = this.robotService
    const request = new robotApi.SendSessionHeartbeatRequest()
    request.setId(id)
    const response = await promisify<robotApi.SendSessionHeartbeatRequest, robotApi.SendSessionHeartbeatResponse>(
      robotService.sendSessionHeartbeat.bind(robotService),
      request
    )
    return response
  }
}
