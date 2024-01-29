// @vitest-environment happy-dom

import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationServiceClient } from '../../gen/service/navigation/v1/navigation_pb_service';
vi.mock('../../gen/service/navigation/v1/navigation_pb_service');
import { RobotClient } from '../../robot';
vi.mock('../../robot');

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

const testLatitude = 50;
const testLongitude = 75;
const testCompassHeading = 90;

describe('getLocation', () => {
  let latitude: Mock<[], number>;
  let longitude: Mock<[], number>;
  let compassHeading: Mock<[], number>;
  let location: Mock<[], { latitude: number; longitude: number }>;

  beforeEach(() => {
    location = vi.fn(() => ({
      latitude: latitude(),
      longitude: longitude(),
    }));

    NavigationServiceClient.prototype.getLocation = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          toObject: () => ({
            compassHeading: compassHeading(),
            location: location(),
          }),
        });
      });
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

    const expected = {
      location: { latitude: testLatitude, longitude: testLongitude },
      compassHeading: testCompassHeading,
    };

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
