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
import { isValidGeoPoint } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { Navigation } from './navigation';
import type {
  CostmapOptions,
  GoToOptions,
  NavigateRouteOptions,
  NavigationPlan,
  NavigationPosition,
  UpdateLocationOptions,
  UpdateRouteOptions,
  UpdateZoneOptions,
  Waypoint,
  ZoneType,
} from './types';

/** Throw if a response is missing a field the API always sets. */
const required = <T>(value: T | undefined, field: string): T => {
  if (value === undefined) {
    throw new Error(`no ${field}`);
  }
  return value;
};

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

  // Locations

  async addLocation(
    locationName: string,
    position?: NavigationPosition,
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
    return required(resp.location, 'location');
  }

  async getLocation(locationName: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetLocationRequest({
      name: this.name,
      locationName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getLocation(request, callOptions);
    const location = required(resp.location, 'location');

    const { position } = location;
    if (
      position?.value.case === 'geoPose' &&
      (!position.value.value.location || !isValidGeoPoint(position.value.value.location))
    ) {
      throw new Error('invalid location');
    }
    return location;
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
    { position, newName }: UpdateLocationOptions,
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
    return required(resp.location, 'location');
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

  // Routes

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
    return required(resp.route, 'route');
  }

  async getRoute(routeName: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetRouteRequest({
      name: this.name,
      routeName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getRoute(request, callOptions);
    return required(resp.route, 'route');
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
    { newName, waypoints }: UpdateRouteOptions,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new UpdateRouteRequest({
      name: this.name,
      routeName,
      newName,
      // Wrapped so an empty list (clear waypoints) is distinct from unset.
      waypoints: waypoints === undefined ? undefined : new WaypointList({ waypoints }),
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.updateRoute(request, callOptions);
    return required(resp.route, 'route');
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

  // Zones

  async addZone(
    zoneName: string,
    type: ZoneType,
    geometry: Record<string, JsonValue>,
    maxSpeed?: number,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new AddZoneRequest({
      name: this.name,
      zoneName,
      type,
      geometry: Struct.fromJson(geometry),
      maxSpeed,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.addZone(request, callOptions);
    return required(resp.zone, 'zone');
  }

  async getZone(zoneName: string, extra = {}, callOptions = this.callOptions) {
    const request = new GetZoneRequest({
      name: this.name,
      zoneName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getZone(request, callOptions);
    return required(resp.zone, 'zone');
  }

  async listZones(type?: ZoneType, extra = {}, callOptions = this.callOptions) {
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
    { type, geometry, maxSpeed, newName }: UpdateZoneOptions,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new UpdateZoneRequest({
      name: this.name,
      zoneName,
      type,
      geometry: geometry === undefined ? undefined : Struct.fromJson(geometry),
      maxSpeed,
      newName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.updateZone(request, callOptions);
    return required(resp.zone, 'zone');
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

  // Planned navigation

  async navigateToLocation(locationName: string, extra = {}, callOptions = this.callOptions) {
    const request = new NavigateToLocationRequest({
      name: this.name,
      locationName,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.navigateToLocation(request, callOptions);
    return required(resp.status, 'status');
  }

  async navigateToPoint(
    destination: NavigationPosition,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = new NavigateToPointRequest({
      name: this.name,
      destination,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.navigateToPoint(request, callOptions);
    return required(resp.status, 'status');
  }

  async navigateRoute(route: NavigateRouteOptions, extra = {}, callOptions = this.callOptions) {
    const request = new NavigateRouteRequest({
      name: this.name,
      ...route,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.navigateRoute(request, callOptions);
    return required(resp.status, 'status');
  }

  async planToPoint(
    destination: NavigationPosition,
    start?: NavigationPosition,
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
    return required(resp.plan, 'plan');
  }

  async planToLocation(
    locationName: string,
    start?: NavigationPosition,
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
    return required(resp.plan, 'plan');
  }

  async executePlan(plan: NavigationPlan, extra = {}, callOptions = this.callOptions) {
    const request = new ExecutePlanRequest({
      name: this.name,
      plan,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.executePlan(request, callOptions);
    return required(resp.status, 'status');
  }

  // Direct navigation

  async goToLocation(
    locationName: string,
    { wait, linearMPerSec }: GoToOptions = {},
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
    return required(resp.status, 'status');
  }

  async goToPoint(
    destination: NavigationPosition,
    { wait, linearMPerSec }: GoToOptions = {},
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
    return required(resp.status, 'status');
  }

  // Goal control

  async suspend(reason = '', extra = {}, callOptions = this.callOptions) {
    const request = new SuspendRequest({
      name: this.name,
      reason,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.suspend(request, callOptions);
    return required(resp.status, 'status');
  }

  async resume(extra = {}, callOptions = this.callOptions) {
    const request = new ResumeRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.resume(request, callOptions);
    return required(resp.status, 'status');
  }

  async cancel(extra = {}, callOptions = this.callOptions) {
    const request = new CancelRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.cancel(request, callOptions);
    return required(resp.status, 'status');
  }

  // State

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    return required(resp.position, 'position');
  }

  async getNavigationStatus(extra = {}, callOptions = this.callOptions) {
    const request = new GetNavigationStatusRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getNavigationStatus(request, callOptions);
    return required(resp.status, 'status');
  }

  async getProperties(callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getProperties(request, callOptions);
    return required(resp.properties, 'properties');
  }

  async getCostmap(
    { layer, stride }: CostmapOptions = {},
    extra = {},
    callOptions = this.callOptions,
  ) {
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
