import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import pb from '../../gen/service/navigation/v1/navigation_pb';
import { RobotClient } from '../../robot';
import { NavigationServiceClient } from '../../gen/service/navigation/v1/navigation_pb_service';
import { doCommandFromClient, encodeGeoPoint, promisify } from '../../utils';
import type { GeoPoint, Options, StructType } from '../../types';
import type { ModeMap } from './types';
import type { Navigation } from './navigation';

/**
 * A gRPC-web client for a Navigation service.
 *
 * @group Clients
 */
export class NavigationClient implements Navigation {
  private client: NavigationServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(NavigationServiceClient);
    this.name = name;
    this.options = options;
  }

  private get service() {
    return this.client;
  }

  async getMode(extra = {}) {
    const { service } = this;

    const request = new pb.GetModeRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.GetModeRequest, pb.GetModeResponse>(
      service.getMode.bind(service),
      request
    );

    return response.getMode();
  }

  async setMode(mode: ModeMap[keyof ModeMap], extra = {}) {
    const { service } = this;

    const request = new pb.SetModeRequest();
    request.setName(this.name);
    request.setMode(mode);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SetModeRequest, pb.SetModeResponse>(
      service.setMode.bind(service),
      request
    );
  }

  async getLocation(extra = {}) {
    const { service } = this;

    const request = new pb.GetLocationRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetLocationRequest,
      pb.GetLocationResponse
    >(service.getLocation.bind(service), request);

    const result = response.getLocation();
    if (!result) {
      throw new Error('no location');
    }
    return result.toObject();
  }

  async getWayPoints(extra = {}) {
    const { service } = this;

    const request = new pb.GetWaypointsRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetWaypointsRequest,
      pb.GetWaypointsResponse
    >(service.getWaypoints.bind(service), request);

    return response.getWaypointsList().map((x) => x.toObject());
  }

  async addWayPoint(location: GeoPoint, extra = {}) {
    const { service } = this;

    const request = new pb.AddWaypointRequest();
    request.setName(this.name);
    request.setLocation(encodeGeoPoint(location));
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.AddWaypointRequest, pb.AddWaypointResponse>(
      service.addWaypoint.bind(service),
      request
    );
  }

  async removeWayPoint(id: string, extra = {}) {
    const { service } = this;

    const request = new pb.RemoveWaypointRequest();
    request.setName(this.name);
    request.setId(id);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.RemoveWaypointRequest, pb.RemoveWaypointResponse>(
      service.removeWaypoint.bind(service),
      request
    );
  }

  async getObstacles(extra = {}) {
    const { service } = this;

    const request = new pb.GetObstaclesRequest();
    request.setName(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetObstaclesRequest,
      pb.GetObstaclesResponse
    >(service.getObstacles.bind(service), request);

    return response.getObstaclesList().map((x) => x.toObject());
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { service } = this;
    return doCommandFromClient(service, this.name, command, this.options);
  }
}
