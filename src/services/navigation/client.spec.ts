// @vitest-environment happy-dom

import { Struct } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Pose } from '../../gen/common/v1/common_pb';
import { NavigationService } from '../../gen/service/navigation/v1/navigation_connect';
import {
  AddLocationResponse,
  AddRouteResponse,
  AddZoneResponse,
  CancelResponse,
  DeleteLocationResponse,
  DeleteRouteResponse,
  DeleteZoneResponse,
  ExecutePlanResponse,
  GetCostmapResponse,
  GetLocationResponse,
  GetNavigationStatusResponse,
  GetPositionResponse,
  GetPropertiesResponse,
  GetRouteResponse,
  GetZoneResponse,
  GoToLocationResponse,
  type GoToPointRequest,
  GoToPointResponse,
  ListLocationsResponse,
  ListRoutesResponse,
  ListZonesResponse,
  Location,
  MapType,
  type NavigateRouteRequest,
  NavigateRouteResponse,
  NavigateToLocationResponse,
  NavigateToPointResponse,
  PlanToLocationResponse,
  PlanToPointResponse,
  Position,
  Properties,
  ResumeResponse,
  Route,
  SuspendResponse,
  UpdateLocationResponse,
  type UpdateRouteRequest,
  UpdateRouteResponse,
  UpdateZoneResponse,
  Waypoint,
  Zone,
} from '../../gen/service/navigation/v1/navigation_pb';
import { RobotClient } from '../../robot';
import { NavigationClient } from './client';
vi.mock('../../robot');

const navigationClientName = 'test-navigation';

const testPosition = new Position({
  value: { case: 'pose', value: new Pose({ x: 1, y: 2, z: 3 }) },
});
const testLocation = new Location({ name: 'home', position: testPosition });
const testWaypoint = new Waypoint({ value: { case: 'location', value: 'home' } });
const testRoute = new Route({ name: 'loop', waypoints: [testWaypoint] });
const testZone = new Zone({ name: 'blocked', type: 'keepout' });

describe('NavigationClient', () => {
  let navigation: NavigationClient;
  let capturedUpdateRoute: UpdateRouteRequest | undefined;
  let capturedNavigateRoute: NavigateRouteRequest | undefined;
  let capturedGoToPoint: GoToPointRequest | undefined;

  beforeEach(() => {
    capturedUpdateRoute = undefined;
    capturedNavigateRoute = undefined;
    capturedGoToPoint = undefined;

    const mockTransport = createRouterTransport(({ service }) => {
      service(NavigationService, {
        addLocation: () => new AddLocationResponse({ location: testLocation }),
        getLocation: () => new GetLocationResponse({ location: testLocation }),
        listLocations: () => new ListLocationsResponse({ locations: [testLocation] }),
        updateLocation: () => new UpdateLocationResponse({ location: testLocation }),
        deleteLocation: () => new DeleteLocationResponse({}),
        addRoute: () => new AddRouteResponse({ route: testRoute }),
        getRoute: () => new GetRouteResponse({ route: testRoute }),
        listRoutes: () => new ListRoutesResponse({ routes: [testRoute] }),
        updateRoute: (req) => {
          capturedUpdateRoute = req;
          return new UpdateRouteResponse({ route: testRoute });
        },
        deleteRoute: () => new DeleteRouteResponse({}),
        addZone: () => new AddZoneResponse({ zone: testZone }),
        getZone: () => new GetZoneResponse({ zone: testZone }),
        listZones: () => new ListZonesResponse({ zones: [testZone] }),
        updateZone: () => new UpdateZoneResponse({ zone: testZone }),
        deleteZone: () => new DeleteZoneResponse({}),
        navigateToLocation: () =>
          new NavigateToLocationResponse({ status: { position: testPosition, localized: true } }),
        navigateToPoint: () =>
          new NavigateToPointResponse({ status: { position: testPosition, localized: true } }),
        navigateRoute: (req) => {
          capturedNavigateRoute = req;
          return new NavigateRouteResponse({ status: { position: testPosition, localized: true } });
        },
        planToPoint: () =>
          new PlanToPointResponse({ plan: { path: [testPosition], lengthM: 1.5 } }),
        planToLocation: () =>
          new PlanToLocationResponse({ plan: { path: [testPosition], lengthM: 1.5 } }),
        executePlan: () =>
          new ExecutePlanResponse({ status: { position: testPosition, localized: true } }),
        goToLocation: () =>
          new GoToLocationResponse({ status: { position: testPosition, localized: true } }),
        goToPoint: (req) => {
          capturedGoToPoint = req;
          return new GoToPointResponse({ status: { position: testPosition, localized: true } });
        },
        suspend: () => new SuspendResponse({ status: { position: testPosition, localized: true } }),
        resume: () => new ResumeResponse({ status: { position: testPosition, localized: true } }),
        cancel: () => new CancelResponse({ status: { position: testPosition, localized: true } }),
        getPosition: () => new GetPositionResponse({ position: testPosition }),
        getNavigationStatus: () =>
          new GetNavigationStatusResponse({
            status: { position: testPosition, localized: true },
          }),
        getProperties: () =>
          new GetPropertiesResponse({
            properties: new Properties({ mapType: MapType.GPS }),
          }),
        getCostmap: () =>
          new GetCostmapResponse({ available: true, layer: 'local', width: 1, height: 1 }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(NavigationService, mockTransport));

    navigation = new NavigationClient(new RobotClient('host'), navigationClientName);
  });

  it('adds a location', async () => {
    await expect(navigation.addLocation('home', testPosition)).resolves.toStrictEqual(testLocation);
  });

  it('gets a location', async () => {
    await expect(navigation.getLocation('home')).resolves.toStrictEqual(testLocation);
  });

  it('lists locations', async () => {
    await expect(navigation.listLocations()).resolves.toStrictEqual([testLocation]);
  });

  it('updates a location', async () => {
    await expect(
      navigation.updateLocation('home', testPosition, 'new-home'),
    ).resolves.toStrictEqual(testLocation);
  });

  it('deletes a location', async () => {
    await expect(navigation.deleteLocation('home')).resolves.not.toThrow();
  });

  it('adds a route', async () => {
    await expect(navigation.addRoute('loop', [testWaypoint])).resolves.toStrictEqual(testRoute);
  });

  it('gets a route', async () => {
    await expect(navigation.getRoute('loop')).resolves.toStrictEqual(testRoute);
  });

  it('lists routes', async () => {
    await expect(navigation.listRoutes()).resolves.toStrictEqual([testRoute]);
  });

  it('updates a route', async () => {
    await expect(navigation.updateRoute('loop', 'new-loop', [testWaypoint])).resolves.toStrictEqual(
      testRoute,
    );
  });

  it('updates a route leaving waypoints unchanged', async () => {
    await expect(navigation.updateRoute('loop', 'new-loop')).resolves.toStrictEqual(testRoute);
    expect(capturedUpdateRoute?.waypoints).toBeUndefined();
  });

  it('updates a route clearing its waypoints', async () => {
    await navigation.updateRoute('loop', undefined, []);
    expect(capturedUpdateRoute?.newName).toBeUndefined();
    expect(capturedUpdateRoute?.waypoints?.waypoints).toStrictEqual([]);
  });

  it('deletes a route', async () => {
    await expect(navigation.deleteRoute('loop')).resolves.not.toThrow();
  });

  it('adds a zone', async () => {
    await expect(navigation.addZone('blocked', 'keepout', new Struct())).resolves.toStrictEqual(
      testZone,
    );
  });

  it('gets a zone', async () => {
    await expect(navigation.getZone('blocked')).resolves.toStrictEqual(testZone);
  });

  it('lists zones', async () => {
    await expect(navigation.listZones()).resolves.toStrictEqual([testZone]);
  });

  it('updates a zone', async () => {
    await expect(navigation.updateZone('blocked', 'keepout')).resolves.toStrictEqual(testZone);
  });

  it('deletes a zone', async () => {
    await expect(navigation.deleteZone('blocked')).resolves.not.toThrow();
  });

  it('navigates to a location', async () => {
    const status = await navigation.navigateToLocation('home');
    expect(status.position).toStrictEqual(testPosition);
  });

  it('navigates to a point', async () => {
    const status = await navigation.navigateToPoint(testPosition);
    expect(status.position).toStrictEqual(testPosition);
  });

  it('navigates a saved route', async () => {
    const status = await navigation.navigateRoute({ routeName: 'loop', loop: true });
    expect(status.position).toStrictEqual(testPosition);
    expect(capturedNavigateRoute?.routeName).toBe('loop');
    expect(capturedNavigateRoute?.waypoints).toStrictEqual([]);
    expect(capturedNavigateRoute?.loop).toBe(true);
    expect(capturedNavigateRoute?.wait).toBe(false);
  });

  it('navigates an inline route', async () => {
    await navigation.navigateRoute({ waypoints: [testWaypoint], startIndex: 1, wait: true });
    expect(capturedNavigateRoute?.routeName).toBe('');
    expect(capturedNavigateRoute?.waypoints).toStrictEqual([testWaypoint]);
    expect(capturedNavigateRoute?.startIndex).toBe(1);
    expect(capturedNavigateRoute?.startNearest).toBe(false);
    expect(capturedNavigateRoute?.wait).toBe(true);
  });

  it('plans to a point', async () => {
    const plan = await navigation.planToPoint(testPosition);
    expect(plan.lengthM).toBe(1.5);
  });

  it('plans to a location', async () => {
    const plan = await navigation.planToLocation('home');
    expect(plan.lengthM).toBe(1.5);
  });

  it('executes a plan', async () => {
    const status = await navigation.executePlan({ path: [testPosition], lengthM: 1.5 });
    expect(status.position).toStrictEqual(testPosition);
  });

  it('goes to a location', async () => {
    const status = await navigation.goToLocation('home');
    expect(status.position).toStrictEqual(testPosition);
  });

  it('goes to a point', async () => {
    const status = await navigation.goToPoint(testPosition);
    expect(status.position).toStrictEqual(testPosition);
    expect(capturedGoToPoint?.wait).toBe(true);
    expect(capturedGoToPoint?.linearMPerSec).toBeUndefined();
  });

  it('goes to a point without waiting', async () => {
    await navigation.goToPoint(testPosition, false, 0.5);
    expect(capturedGoToPoint?.wait).toBe(false);
    expect(capturedGoToPoint?.linearMPerSec).toBe(0.5);
  });

  it('suspends the current goal', async () => {
    const status = await navigation.suspend('obstacle');
    expect(status.position).toStrictEqual(testPosition);
  });

  it('resumes the suspended goal', async () => {
    const status = await navigation.resume();
    expect(status.position).toStrictEqual(testPosition);
  });

  it('cancels the current goal', async () => {
    const status = await navigation.cancel();
    expect(status.position).toStrictEqual(testPosition);
  });

  it('gets the current position', async () => {
    await expect(navigation.getPosition()).resolves.toStrictEqual(testPosition);
  });

  it('gets the navigation status', async () => {
    const status = await navigation.getNavigationStatus();
    expect(status.position).toStrictEqual(testPosition);
  });

  it('gets properties', async () => {
    const properties = await navigation.getProperties();
    expect(properties.mapType).toBe(MapType.GPS);
  });

  it('gets the costmap', async () => {
    const costmap = await navigation.getCostmap();
    expect(costmap.available).toBe(true);
  });
});
