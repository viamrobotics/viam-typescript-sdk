// @vitest-environment happy-dom

import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import GRPCConnectionManager from './grpc-connection-manager';

const host = 'fakeServiceHsot';
const transport = new FakeTransportBuilder().build();

let cm: GRPCConnectionManager;

describe('GPRCConnectionManager', () => {
  beforeEach(() => {
    cm = new GRPCConnectionManager(host, transport);
    vi.mock('./gen/robot/v1/robot_pb_service');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('no connecting attempt initially', () => {
    expect(cm.connecting).toBe(undefined);
  });

  test('call heartbeat successfully', async () => {
    await cm.start();
    expect(cm.connecting).toBe(undefined);
  });
});
