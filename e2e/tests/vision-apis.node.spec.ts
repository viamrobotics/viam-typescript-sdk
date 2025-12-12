import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient, VisionClient, CameraClient } from '../../src/main';
import { defaultNodeConfig } from '../fixtures/configs/dial-configs';

const isCI = process.env.CI !== undefined;
const log = (...args: unknown[]) => {
  if (isCI) {
    // eslint-disable-next-line no-console
    console.log('[vision-test]', ...args);
  }
};

describe('Vision API Tests', () => {
  let client: RobotClient;
  let vision: VisionClient;
  let camera: CameraClient;

  beforeEach(async () => {
    log('beforeEach: creating RobotClient');
    client = new RobotClient();
    log('beforeEach: dialing with config', defaultNodeConfig);
    await client.dial(defaultNodeConfig);
    log('beforeEach: dial complete, creating service clients');
    vision = new VisionClient(client, 'fake_vision');
    camera = new CameraClient(client, 'fake_camera');
    log('beforeEach: setup complete');
  });

  afterEach(async () => {
    log('afterEach: disconnecting');
    await client.disconnect();
    log('afterEach: disconnect complete');
  });

  it('should get vision service properties after connecting', async () => {
    log('test: getting vision properties');
    // Act
    const properties = await vision.getProperties();
    log('test: got properties', properties);

    // Assert - Verify properties structure
    expect(properties).toEqual(
      expect.objectContaining({
        classificationsSupported: expect.any(Boolean),
        detectionsSupported: expect.any(Boolean),
        objectPointCloudsSupported: expect.any(Boolean),
      })
    );
  });

  it('should get detections from camera', async () => {
    log('test: warming up camera');
    // Warmup: ensure camera is initialized before vision service accesses it
    const cameraProps = await camera.getProperties();
    log('test: camera warmup complete', cameraProps);

    log('test: getting images from camera directly');
    const images = await camera.getImages();
    log('test: got images from camera', { imageCount: images.images.length });

    log('test: calling getDetectionsFromCamera');
    // Act
    const detections = await vision.getDetectionsFromCamera('fake_camera');
    log('test: got detections', { count: detections.length });

    // Assert - Should return an array of detections
    expect(detections.length).toBeGreaterThan(0);
  });
});
