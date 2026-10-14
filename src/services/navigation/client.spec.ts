// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RobotClient } from '../../robot';
vi.mock('../../robot');

import { Struct } from '@bufbuild/protobuf';
import { createClient, createRouterTransport, type ServiceImpl } from '@connectrpc/connect';
import { NavigationService } from '../../gen/service/navigation/v1/navigation_connect';
import {
  type AddLocationRequest,
  AddLocationResponse,
  type AddZoneRequest,
  AddZoneResponse,
  GetCostmapResponse,
  GetLocationResponse,
  GetPropertiesResponse,
  GoalState,
  type GoToPointRequest,
  GoToPointResponse,
  Location,
  MapType,
  type NavigateRouteRequest,
  NavigateRouteResponse,
  NavMode,
  Plan,
  PlanToPointResponse,
  Position,
  Properties,
  Route,
  Status,
  type UpdateRouteRequest,
  UpdateRouteResponse,
  Zone,
} from '../../gen/service/navigation/v1/navigation_pb';
import { NavigationClient } from './client';

const navigationClientName = 'test-navigation';

const gpsPosition = (latitude: number, longitude: number) =>
  new Position({
    value: {
      case: 'geoPose',
      value: { location: { latitude, longitude } },
    },
  });

const activeStatus = new Status({
  localized: true,
  goal: { state: GoalState.ACTIVE, mode: NavMode.ROUTE },
});

const setup = (handlers: Partial<ServiceImpl<typeof NavigationService>>) => {
  const mockTransport = createRouterTransport(({ service }) => {
    service(NavigationService, handlers);
  });

  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => createClient(NavigationService, mockTransport));

  return new NavigationClient(new RobotClient('host'), navigationClientName);
};

describe('NavigationClient', () => {
  describe('getLocation', () => {
    let response: GetLocationResponse;
    let navigation: NavigationClient;

    beforeEach(() => {
      navigation = setup({ getLocation: () => response });
    });

    it('returns the saved location', async () => {
      const expected = new Location({ name: 'dock', position: gpsPosition(50, 75) });
      response = new GetLocationResponse({ location: expected });

      await expect(navigation.getLocation('dock')).resolves.toStrictEqual(expected);
    });

    it('accepts a local pose', async () => {
      const expected = new Location({
        name: 'dock',
        position: { value: { case: 'pose', value: { x: 1, y: 2, z: 0 } } },
      });
      response = new GetLocationResponse({ location: expected });

      await expect(navigation.getLocation('dock')).resolves.toStrictEqual(expected);
    });

    it('throws when the location is missing', async () => {
      response = new GetLocationResponse();

      await expect(navigation.getLocation('dock')).rejects.toThrow(/^no location$/u);
    });

    it('throws on an invalid geopoint', async () => {
      response = new GetLocationResponse({
        location: { name: 'dock', position: gpsPosition(Number.NaN, Number.NaN) },
      });

      await expect(navigation.getLocation('dock')).rejects.toThrow(/^invalid location$/u);
    });
  });

  it('addLocation sends the location name and position', async () => {
    let captured: AddLocationRequest | undefined;
    const navigation = setup({
      addLocation: (req) => {
        captured = req;
        return new AddLocationResponse({
          location: { name: req.locationName, position: req.position },
        });
      },
    });

    const location = await navigation.addLocation('gate', gpsPosition(50, 75));

    expect(captured?.name).toBe(navigationClientName);
    expect(captured?.locationName).toBe('gate');
    expect(location.position).toStrictEqual(gpsPosition(50, 75));
  });

  describe('updateRoute', () => {
    let captured: UpdateRouteRequest | undefined;
    let navigation: NavigationClient;

    beforeEach(() => {
      captured = undefined;
      navigation = setup({
        updateRoute: (req) => {
          captured = req;
          return new UpdateRouteResponse({ route: new Route({ name: 'patrol' }) });
        },
      });
    });

    it('leaves waypoints unset when omitted', async () => {
      await navigation.updateRoute('patrol', { newName: 'night-patrol' });

      expect(captured?.newName).toBe('night-patrol');
      expect(captured?.waypoints).toBeUndefined();
    });

    it('sends an empty waypoint list to clear the route', async () => {
      await navigation.updateRoute('patrol', { waypoints: [] });

      expect(captured?.waypoints).toBeDefined();
      expect(captured?.waypoints?.waypoints).toStrictEqual([]);
    });
  });

  it('addZone converts geometry to a Struct', async () => {
    let captured: AddZoneRequest | undefined;
    const navigation = setup({
      addZone: (req) => {
        captured = req;
        return new AddZoneResponse({ zone: new Zone({ name: req.zoneName }) });
      },
    });
    const geometry = { type: 'circle', radius: 2 };

    await navigation.addZone('bay', 'speed_limit', geometry, 0.5);

    expect(captured?.type).toBe('speed_limit');
    expect(captured?.geometry).toStrictEqual(Struct.fromJson(geometry));
    expect(captured?.maxSpeed).toBe(0.5);
  });

  it('navigateRoute passes route options and returns the status', async () => {
    let captured: NavigateRouteRequest | undefined;
    const navigation = setup({
      navigateRoute: (req) => {
        captured = req;
        return new NavigateRouteResponse({ status: activeStatus });
      },
    });

    const status = await navigation.navigateRoute({
      routeName: 'patrol',
      startNearest: true,
      loop: true,
    });

    expect(captured?.routeName).toBe('patrol');
    expect(captured?.startNearest).toBe(true);
    expect(captured?.loop).toBe(true);
    expect(status).toStrictEqual(activeStatus);
  });

  it('goToPoint passes wait and speed', async () => {
    let captured: GoToPointRequest | undefined;
    const navigation = setup({
      goToPoint: (req) => {
        captured = req;
        return new GoToPointResponse({ status: activeStatus });
      },
    });

    await navigation.goToPoint(gpsPosition(50, 75), { wait: false, linearMPerSec: 0.5 });

    expect(captured?.destination).toStrictEqual(gpsPosition(50, 75));
    expect(captured?.wait).toBe(false);
    expect(captured?.linearMPerSec).toBe(0.5);
  });

  it('planToPoint returns the plan', async () => {
    const plan = new Plan({ path: [gpsPosition(50, 75)], lengthM: 12 });
    const navigation = setup({ planToPoint: () => new PlanToPointResponse({ plan }) });

    await expect(navigation.planToPoint(gpsPosition(50, 75))).resolves.toStrictEqual(plan);
  });

  it('throws when a status is missing', async () => {
    const navigation = setup({ navigateRoute: () => new NavigateRouteResponse() });

    await expect(navigation.navigateRoute({ routeName: 'patrol' })).rejects.toThrow(/^no status$/u);
  });

  it('getProperties returns the properties', async () => {
    const properties = new Properties({ mapType: MapType.GPS, routesSupported: true });
    const navigation = setup({
      getProperties: () => new GetPropertiesResponse({ properties }),
    });

    await expect(navigation.getProperties()).resolves.toStrictEqual(properties);
  });

  it('getCostmap returns the full response', async () => {
    const costmap = new GetCostmapResponse({
      available: true,
      layer: 'global',
      width: 2,
      height: 1,
      data: new Uint8Array([0, 100]),
    });
    const navigation = setup({ getCostmap: () => costmap });

    await expect(navigation.getCostmap({ layer: 'global' })).resolves.toStrictEqual(costmap);
  });
});
