import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { PromiseClient } from '@connectrpc/connect';
import { NavigationService } from '../../gen/service/navigation/v1/navigation_connect';
import {
  AddWaypointRequest,
  GetLocationRequest,
  GetModeRequest,
  GetObstaclesRequest,
  GetPathsRequest,
  GetPropertiesRequest,
  GetWaypointsRequest,
  RemoveWaypointRequest,
  SetModeRequest,
} from '../../gen/service/navigation/v1/navigation_pb';
import { RobotClient } from '../../robot';
import type { GeoPoint, Options } from '../../types';
import { isValidGeoPoint } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Navigation } from './navigation';
import type { Mode } from './types';

/**
 * A gRPC-web client for a Navigation service.
 *
 * @group Clients
 */
export class NavigationClient implements Navigation {
  private client: PromiseClient<typeof NavigationService>;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(NavigationService);
    this.name = name;
    this.options = options;
  }

  async getMode(extra = {}) {
    const request = new GetModeRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getMode(request);
    return resp.mode;
  }

  async setMode(mode: Mode, extra = {}) {
    const request = new SetModeRequest({
      name: this.name,
      mode,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setMode(request);
  }

  async getLocation(extra = {}) {
    const request = new GetLocationRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getLocation(request);

    if (!response.location) {
      throw new Error('no location');
    }
    if (!isValidGeoPoint(response.location)) {
      throw new Error('invalid location');
    }
    return response;
  }

  async getWayPoints(extra = {}) {
    const request = new GetWaypointsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getWaypoints(request);
    return resp.waypoints;
  }

  async addWayPoint(location: GeoPoint, extra = {}) {
    const request = new AddWaypointRequest({
      name: this.name,
      location,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.addWaypoint(request);
  }

  async removeWayPoint(id: string, extra = {}) {
    const request = new RemoveWaypointRequest({
      name: this.name,
      id,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.removeWaypoint(request);
  }

  async getObstacles(extra = {}) {
    const request = new GetObstaclesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getObstacles(request);
    return resp.obstacles;
  }

  async getPaths(extra = {}) {
    const request = new GetPathsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPaths(request);
    return resp.paths;
  }

  async getProperties() {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request);
  }

  async doCommand(command: Struct): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options
    );
  }
}
