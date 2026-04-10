// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { create } from '@bufbuild/protobuf';

import {
  type DoCommandRequest,
  DoCommandResponseSchema,
  type GetStatusRequest,
  GetStatusResponseSchema,
} from './gen/common/v1/common_pb';
import { doCommandFromClient, getStatusFromClient } from './utils';

describe('doCommandFromClient', () => {
  it('accepts a plain object', async () => {
    const doCommander = vi.fn().mockResolvedValue(
      create(DoCommandResponseSchema, {
        result: { result: 'ok' },
      })
    );

    const result = await doCommandFromClient(doCommander, 'test', {
      foo: 'bar',
    });

    expect(result).toStrictEqual({ result: 'ok' });
    const [request] = doCommander.mock.calls[0] as [DoCommandRequest];
    expect(request.name).toBe('test');
    expect(request.command).toStrictEqual({ foo: 'bar' });
  });

  it('returns empty object when result is undefined', async () => {
    const doCommander = vi
      .fn()
      .mockResolvedValue(create(DoCommandResponseSchema, {}));

    const result = await doCommandFromClient(doCommander, 'test', {});

    expect(result).toStrictEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const doCommander = vi
      .fn()
      .mockResolvedValue(create(DoCommandResponseSchema, {}));
    const requestLogger = vi.fn();

    await doCommandFromClient(
      doCommander,
      'test',
      { foo: 'bar' },
      { requestLogger }
    );

    expect(requestLogger).toHaveBeenCalledOnce();
    const [loggedRequest] = requestLogger.mock.calls[0] as [DoCommandRequest];
    expect(loggedRequest.name).toBe('test');
    expect(loggedRequest.command).toStrictEqual({ foo: 'bar' });
  });
});

describe('getStatusFromClient', () => {
  it('returns the status as JSON', async () => {
    const getStatusMethod = vi.fn().mockResolvedValue(
      create(GetStatusResponseSchema, {
        result: { state: 'running' },
      })
    );

    const result = await getStatusFromClient(getStatusMethod, 'test');

    expect(result).toStrictEqual({ state: 'running' });
    const [request] = getStatusMethod.mock.calls[0] as [GetStatusRequest];
    expect(request.name).toBe('test');
  });

  it('returns empty object when result is undefined', async () => {
    const getStatusMethod = vi
      .fn()
      .mockResolvedValue(create(GetStatusResponseSchema, {}));

    const result = await getStatusFromClient(getStatusMethod, 'test');

    expect(result).toStrictEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const getStatusMethod = vi
      .fn()
      .mockResolvedValue(create(GetStatusResponseSchema, {}));
    const requestLogger = vi.fn();

    await getStatusFromClient(getStatusMethod, 'test', { requestLogger });

    expect(requestLogger).toHaveBeenCalledOnce();
    const [loggedRequest] = requestLogger.mock.calls[0] as [GetStatusRequest];
    expect(loggedRequest.name).toBe('test');
  });
});
