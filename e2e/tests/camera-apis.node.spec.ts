import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient, CameraClient } from '../../src/main';
import { defaultNodeConfig } from '../fixtures/configs/dial-configs';

describe('Camera API Tests', () => {
  let client: RobotClient;
  let camera: CameraClient;

  beforeEach(async () => {
    client = new RobotClient();
    await client.dial(defaultNodeConfig);
    camera = new CameraClient(client, 'fake_camera');
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should get camera properties after connecting', async () => {
    // Act
    const properties = await camera.getProperties();

    // Assert - Verify properties structure
    expect(properties).toEqual(
      expect.objectContaining({
        supportsPcd: expect.any(Boolean),
      })
    );
  });

  it('should get images from camera', async () => {
    // Act
    const images = await camera.getImages();

    // Assert - Verify we got images
    expect(images.images.length).toBeGreaterThan(0);
    expect(images.metadata).toBeDefined();
  });
});
