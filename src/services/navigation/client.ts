import { type JsonObject, type JsonValue, create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import {
  NavigationService,
  AddWaypointRequestSchema,
  GetLocationRequestSchema,
  GetModeRequestSchema,
  GetObstaclesRequestSchema,
  GetPathsRequestSchema,
  GetPropertiesRequestSchema,
  GetWaypointsRequestSchema,
  RemoveWaypointRequestSchema,
  SetModeRequestSchema,
} from '../../gen/service/navigation/v1/navigation_pb';

import { type RobotClient } from '../../robot';
import { isValidGeoPoint, type GeoPoint, type Options } from '../../types';

import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { Navigation } from './navigation';
import type { Mode } from './types';

/**
 * A gRPC-web client for a Navigation service.
 *
 * @group Clients
 */
export class NavigationClient implements Navigation {
  private client: Client<typeof NavigationService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(NavigationService);
    this.name = name;
    this.options = options;
  }

  async getMode(extra = {}, callOptions = this.callOptions) {
    const request = create(GetModeRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getMode(request, callOptions);
    return resp.mode;
  }

  async setMode(mode: Mode, extra = {}, callOptions = this.callOptions) {
    const request = create(SetModeRequestSchema, {
      name: this.name,
      mode,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.setMode(request, callOptions);
  }

  async getLocation(extra = {}, callOptions = this.callOptions) {
    const request = create(GetLocationRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getLocation(request, callOptions);

    if (!response.location) {
      throw new Error('no location');
    }
    if (!isValidGeoPoint(response.location)) {
      throw new Error('invalid location');
    }
    return response;
  }

  async getWayPoints(extra = {}, callOptions = this.callOptions) {
    const request = create(GetWaypointsRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getWaypoints(request, callOptions);
    return resp.waypoints;
  }

  async addWayPoint(location: GeoPoint, extra = {}, callOptions = this.callOptions) {
    const request = create(AddWaypointRequestSchema, {
      name: this.name,
      location,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.addWaypoint(request, callOptions);
  }

  async removeWayPoint(id: string, extra = {}, callOptions = this.callOptions) {
    const request = create(RemoveWaypointRequestSchema, {
      name: this.name,
      id,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.removeWaypoint(request, callOptions);
  }

  async getObstacles(extra = {}, callOptions = this.callOptions) {
    const request = create(GetObstaclesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getObstacles(request, callOptions);
    return resp.obstacles;
  }

  async getPaths(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPathsRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPaths(request, callOptions);
    return resp.paths;
  }

  async getProperties(callOptions = this.callOptions) {
    const request = create(GetPropertiesRequestSchema, {
      name: this.name,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonValue> {
    return getStatusFromClient(this.client.getStatus, this.name, this.options, callOptions);
  }

  async doCommand(
    command: JsonObject | Record<string, JsonValue>,
    callOptions = this.callOptions,
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
