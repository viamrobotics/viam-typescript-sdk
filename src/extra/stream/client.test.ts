// @vitest-environment happy-dom

import { describe, expect, test } from 'vitest';
import { RobotClient } from '../../robot';
import { events } from '../../events';
import { StreamClient } from './client';

describe('StreamClient', () => {
  test('webrtc track will cause the client to emit an event', () =>
    new Promise<void>((done) => {
      const host = 'fakeServiceHost';
      const client = new RobotClient(host);
      const streamClient = new StreamClient(client);

      streamClient.on('track', (data) => {
        expect((data as { mock: true }).mock).eq(true);
        done();
      });

      events.emit('track', { mock: true });
    }));
});
