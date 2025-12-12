import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient, VisionClient, CameraClient } from '../../src/main';
import { defaultNodeConfig } from '../fixtures/configs/dial-configs';

describe('Vision API Tests', () => {
  let client: RobotClient;
  let vision: VisionClient;
  let camera: CameraClient;

  beforeEach(async () => {
    client = new RobotClient();
    await client.dial(defaultNodeConfig);
    vision = new VisionClient(client, 'fake_vision');
    camera = new CameraClient(client, 'fake_camera');
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should get vision service properties after connecting', async () => {
    // Act
    const properties = await vision.getProperties();

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
    // Arrange - Should be initialized before vision service accesses it
    await camera.getProperties();

    // Act
    const detections = await vision.getDetectionsFromCamera('fake_camera');

    // Assert - Should return an array of detections
    expect(detections.length).toBeGreaterThan(0);
  });
});
