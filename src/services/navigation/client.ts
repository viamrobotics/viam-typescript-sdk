import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { NavigationService } from '../../gen/service/navigation/v1/navigation_connect';
import {
  AddLocationRequest,
  AddRouteRequest,
  AddZoneRequest,
  CancelRequest,
  DeleteLocationRequest,
  DeleteRouteRequest,
  DeleteZoneRequest,
  ExecutePlanRequest,
  GetCostmapRequest,
  GetLocationRequest,
  GetNavigationStatusRequest,
  GetPositionRequest,
  GetPropertiesRequest,
  GetRouteRequest,
  GetZoneRequest,
  GoToLocationRequest,
  GoToPointRequest,
  ListLocationsRequest,
  ListRoutesRequest,
  ListZonesRequest,
  NavigateRouteRequest,
  NavigateToLocationRequest,
  NavigateToPointRequest,
  PlanToLocationRequest,
  PlanToPointRequest,
  ResumeRequest,
  SuspendRequest,
  UpdateLocationRequest,
  UpdateRouteRequest,
  UpdateZoneRequest,
  WaypointList,
} from '../../gen/service/navigation/v1/navigation_pb';
import { type RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { Navigation } from './navigation';
import type { NavigateRouteOptions, Plan, Position, Waypoint } from './types';

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

  async addLocation(
    locationName: string,
    position?: Position,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new AddLocationRequest({
      name: this.name,
      locationName,
      position,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.addLocation(request, callOptions);
    if (!resp.location) {
      throw new Error('no location');
    }
    return resp.location;
  }

  async getLocation(locationName: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetLocationRequest({
      name: this.name,
      locationName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getLocation(request, callOptions);
    if (!resp.location) {
      throw new Error('no location');
    }
    return resp.location;
  }

  async listLocations(extra = {}, callOptions = this.callOptions) {
    const request = new ListLocationsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.listLocations(request, callOptions);
    return resp.locations;
  }

  async updateLocation(
    locationName: string,
    position?: Position,
    newName?: string,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new UpdateLocationRequest({
      name: this.name,
      locationName,
      position,
      newName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.updateLocation(request, callOptions);
    if (!resp.location) {
      throw new Error('no location');
    }
    return resp.location;
  }

  async deleteLocation(locationName: string, extra = {}, callOptions = this.callOptions) {
    const request = new DeleteLocationRequest({
      name: this.name,
      locationName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.deleteLocation(request, callOptions);
  }

  async addRoute(
    routeName: string,
    waypoints: Waypoint[],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new AddRouteRequest({
      name: this.name,
      routeName,
      waypoints,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.addRoute(request, callOptions);
    if (!resp.route) {
      throw new Error('no route');
    }
    return resp.route;
  }

  async getRoute(routeName: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetRouteRequest({
      name: this.name,
      routeName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getRoute(request, callOptions);
    if (!resp.route) {
      throw new Error('no route');
    }
    return resp.route;
  }

  async listRoutes(extra = {}, callOptions = this.callOptions) {
    const request = new ListRoutesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.listRoutes(request, callOptions);
    return resp.routes;
  }

  async updateRoute(
    routeName: string,
    newName?: string,
    waypoints?: Waypoint[],
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new UpdateRouteRequest({
      name: this.name,
      routeName,
      newName,
      waypoints: waypoints === undefined ? undefined : new WaypointList({ waypoints }),
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.updateRoute(request, callOptions);
    if (!resp.route) {
      throw new Error('no route');
    }
    return resp.route;
  }

  async deleteRoute(routeName: string, extra = {}, callOptions = this.callOptions) {
    const request = new DeleteRouteRequest({
      name: this.name,
      routeName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.deleteRoute(request, callOptions);
  }

  async addZone(
    zoneName: string,
    type: string,
    geometry: Struct,
    maxSpeed?: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new AddZoneRequest({
      name: this.name,
      zoneName,
      type,
      geometry,
      maxSpeed,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.addZone(request, callOptions);
    if (!resp.zone) {
      throw new Error('no zone');
    }
    return resp.zone;
  }

  async getZone(zoneName: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetZoneRequest({
      name: this.name,
      zoneName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getZone(request, callOptions);
    if (!resp.zone) {
      throw new Error('no zone');
    }
    return resp.zone;
  }

  async listZones(type = '', extra = {}, callOptions = this.callOptions) {
    const request = new ListZonesRequest({
      name: this.name,
      type,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.listZones(request, callOptions);
    return resp.zones;
  }

  async updateZone(
    zoneName: string,
    type?: string,
    geometry?: Struct,
    maxSpeed?: number,
    newName?: string,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new UpdateZoneRequest({
      name: this.name,
      zoneName,
      type,
      geometry,
      maxSpeed,
      newName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.updateZone(request, callOptions);
    if (!resp.zone) {
      throw new Error('no zone');
    }
    return resp.zone;
  }

  async deleteZone(zoneName: string, extra = {}, callOptions = this.callOptions) {
    const request = new DeleteZoneRequest({
      name: this.name,
      zoneName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.deleteZone(request, callOptions);
  }

  async navigateToLocation(locationName: string, extra = {}, callOptions = this.callOptions) {
    const request = new NavigateToLocationRequest({
      name: this.name,
      locationName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.navigateToLocation(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async navigateToPoint(destination: Position, extra = {}, callOptions = this.callOptions) {
    const request = new NavigateToPointRequest({
      name: this.name,
      destination,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.navigateToPoint(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async navigateRoute(
    {
      routeName = '',
      waypoints = [],
      startIndex = 0,
      startNearest = false,
      loop = false,
      wait = false,
    }: NavigateRouteOptions,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new NavigateRouteRequest({
      name: this.name,
      routeName,
      waypoints,
      startIndex,
      startNearest,
      loop,
      wait,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.navigateRoute(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async planToPoint(
    destination: Position,
    start?: Position,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new PlanToPointRequest({
      name: this.name,
      destination,
      start,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.planToPoint(request, callOptions);
    if (!resp.plan) {
      throw new Error('no plan');
    }
    return resp.plan;
  }

  async planToLocation(
    locationName: string,
    start?: Position,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new PlanToLocationRequest({
      name: this.name,
      locationName,
      start,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.planToLocation(request, callOptions);
    if (!resp.plan) {
      throw new Error('no plan');
    }
    return resp.plan;
  }

  async executePlan(plan: Plan, extra = {}, callOptions = this.callOptions) {
    const request = new ExecutePlanRequest({
      name: this.name,
      plan,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.executePlan(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async goToLocation(
    locationName: string,
    wait = true,
    linearMPerSec?: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new GoToLocationRequest({
      name: this.name,
      locationName,
      wait,
      linearMPerSec,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.goToLocation(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async goToPoint(
    destination: Position,
    wait = true,
    linearMPerSec?: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new GoToPointRequest({
      name: this.name,
      destination,
      wait,
      linearMPerSec,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.goToPoint(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async suspend(reason = '', extra = {}, callOptions = this.callOptions) {
    const request = new SuspendRequest({
      name: this.name,
      reason,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.suspend(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async resume(extra = {}, callOptions = this.callOptions) {
    const request = new ResumeRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.resume(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async cancel(extra = {}, callOptions = this.callOptions) {
    const request = new CancelRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.cancel(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    if (!resp.position) {
      throw new Error('no position');
    }
    return resp.position;
  }

  async getNavigationStatus(extra = {}, callOptions = this.callOptions) {
    const request = new GetNavigationStatusRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getNavigationStatus(request, callOptions);
    if (!resp.status) {
      throw new Error('no status');
    }
    return resp.status;
  }

  async getProperties(callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getProperties(request, callOptions);
    if (!resp.properties) {
      throw new Error('no properties');
    }
    return resp.properties;
  }

  async getCostmap(layer = 'auto', stride = 2, extra = {}, callOptions = this.callOptions) {
    const request = new GetCostmapRequest({
      name: this.name,
      layer,
      stride,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getCostmap(request, callOptions);
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonValue> {
    return getStatusFromClient(this.client.getStatus, this.name, this.options, callOptions);
  }

  async doCommand(
    command: Struct | Record<string, JsonValue>,
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
