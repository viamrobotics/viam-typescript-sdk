// @vitest-environment happy-dom

import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { NavigationServiceClient } from '../../gen/service/navigation/v1/navigation_pb_service';
vi.mock('../../gen/service/navigation/v1/navigation_pb_service');
import { RobotClient } from '../../robot';
vi.mock('../../robot');

import type common from '../../gen/common/v1/common_pb';
import { NavigationClient } from './client';

const navigationClientName = 'test-navigation';

let navigation: NavigationClient;

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(
      () => new NavigationServiceClient(navigationClientName)
    );

  navigation = new NavigationClient(
    new RobotClient('host'),
    navigationClientName
  );
});

describe('getLocation', () => {
  let latitude: number | undefined;
  let longitude: number | undefined;
  let compassHeading: number | undefined;
  let getLocation;

  beforeEach(() => {
    getLocation = () => ({
      getLatitude: () => latitude,
      getLongitude: () => longitude,
    });

    NavigationServiceClient.prototype.getLocation = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getLocation,
          toObject: () => ({
            compassHeading,
            location: { latitude, longitude },
          }),
        });
      });
  });

  afterEach(() => {
    latitude = undefined;
    longitude = undefined;
    compassHeading = undefined;
    getLocation = undefined;
  });

  test('null location', async () => {
    getLocation = () => null;

    await expect(navigation.getLocation()).rejects.toThrowError(
      /^no location$/u
    );
  });

  test('valid geopoint', async () => {
    latitude = 50;
    longitude = 75;
    compassHeading = 90;

    const expected = {
      location: { latitude, longitude },
      compassHeading,
    };
    await expect(navigation.getLocation()).resolves.toStrictEqual(expected);
  });

  test('invalid geopoint', async () => {
    latitude = Number.NaN;
    longitude = Number.NaN;

    await expect(navigation.getLocation()).rejects.toThrowError(
      /^invalid location$/u
    );
  });
});
