import { vi, describe, afterEach, it } from 'vitest';
import { when } from 'jest-when';

import * as sdk from '@viamrobotics/sdk';
import * as subject from '../client.js';

vi.mock('@viamrobotics/sdk', () => ({
  createRobotClient: vi.fn(),
  StreamClient: vi.fn(),
}));

describe('SDK client', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should connect to a robot', async () => {
    const mockClient = { sessionId: 'abc123' } as sdk.RobotClient;
    const expectedConfig = {
      host: 'example.com',
      authEntity: 'example.com',
      credential: { type: 'robot-location-secret', payload: 'open seasame' },
      signalingAddress: 'https://app.viam.com:443',
      iceServers: [],
    };

    when(sdk.createRobotClient)
      .calledWith(expectedConfig)
      .mockResolvedValueOnce(mockClient);

    const result = await subject.getRobotClient({
      hostname: 'example.com',
      secret: 'open seasame',
    });

    expect(result).toBe(mockClient);
  });

  it('should create a stream client', () => {
    const mockClient = { sessionId: 'abc123' } as sdk.RobotClient;
    const mockStreamClient = { add: vi.fn() } as unknown as sdk.StreamClient;

    // @ts-expect-error: sdk.StreamClient is a mock
    when(sdk.StreamClient)
      .calledWith(mockClient)
      .mockReturnValueOnce(mockStreamClient);

    const result = subject.getStreamClient(mockClient);

    expect(result).toBe(mockStreamClient);
  });
});
