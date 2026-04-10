// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { RobotClient } from '../../robot';
vi.mock('../../robot');

import { create } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';

import {
  GetLocationResponseSchema,
  NavigationService,
} from '../../gen/service/navigation/v1/navigation_pb';
import { NavigationClient } from './client';

const navigationClientName = 'test-navigation';
const testLatitude = 50;
const testLongitude = 75;
const testCompassHeading = 90;

describe('getLocation', () => {
  let latitude: Mock<[], number>;
  let longitude: Mock<[], number>;
  let compassHeading: Mock<[], number>;
  let location: Mock<[], { latitude: number; longitude: number }>;

  let navigation: NavigationClient;

  beforeEach(() => {
    location = vi.fn(() => ({
      latitude: latitude(),
      longitude: longitude(),
    }));

    const mockTransport = createRouterTransport(({ service }) => {
      service(NavigationService, {
        getLocation: () =>
          create(GetLocationResponseSchema, {
            compassHeading: compassHeading(),
            location: location(),
          }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(NavigationService, mockTransport));

    navigation = new NavigationClient(
      new RobotClient('host'),
      navigationClientName
    );
  });

  it('null location', async () => {
    location = vi.fn();
    compassHeading = vi.fn();

    await expect(navigation.getLocation()).rejects.toThrowError(
      /^no location$/u
    );

    expect(location).toHaveBeenCalledOnce();
    expect(compassHeading).toHaveBeenCalledOnce();
  });

  it('valid geopoint', async () => {
    latitude = vi.fn(() => testLatitude);
    longitude = vi.fn(() => testLongitude);
    compassHeading = vi.fn(() => testCompassHeading);

    const expected = create(GetLocationResponseSchema, {
      location: { latitude: testLatitude, longitude: testLongitude },
      compassHeading: testCompassHeading,
    });

    await expect(navigation.getLocation()).resolves.toStrictEqual(expected);

    expect(location).toHaveBeenCalledOnce();
    expect(compassHeading).toHaveBeenCalledOnce();
  });

  it('invalid geopoint', async () => {
    latitude = vi.fn(() => Number.NaN);
    longitude = vi.fn(() => Number.NaN);

    await expect(navigation.getLocation()).rejects.toThrowError(
      /^invalid location$/u
    );

    expect(location).toHaveBeenCalledOnce();
    expect(compassHeading).toHaveBeenCalledOnce();
  });
});
