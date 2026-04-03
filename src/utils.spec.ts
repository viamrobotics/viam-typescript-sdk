// @vitest-environment happy-dom

import { Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import {
  DoCommandRequest,
  DoCommandResponse,
  GetStatusRequest,
  GetStatusResponse,
} from './gen/common/v1/common_pb';
import { doCommandFromClient, getStatusFromClient } from './utils';

describe('doCommandFromClient', () => {
  it('accepts a Struct command', async () => {
    const command = Struct.fromJson({ foo: 'bar' });
    const doCommander = vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson({ result: 'ok' }),
      })
    );

    const result = await doCommandFromClient(doCommander, 'test', command);

    expect(result).toStrictEqual({ result: 'ok' });
    const [request] = doCommander.mock.calls[0] as [DoCommandRequest];
    expect(request.name).toBe('test');
    expect(request.command?.toJson()).toStrictEqual({ foo: 'bar' });
  });

  it('accepts a plain object and converts it to a Struct', async () => {
    const doCommander = vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson({ result: 'ok' }),
      })
    );

    const result = await doCommandFromClient(doCommander, 'test', {
      foo: 'bar',
    });

    expect(result).toStrictEqual({ result: 'ok' });
    const [request] = doCommander.mock.calls[0] as [DoCommandRequest];
    expect(request.name).toBe('test');
    expect(request.command?.toJson()).toStrictEqual({ foo: 'bar' });
  });

  it('returns empty object when result is undefined', async () => {
    const doCommander = vi.fn().mockResolvedValue(new DoCommandResponse({}));

    const result = await doCommandFromClient(
      doCommander,
      'test',
      Struct.fromJson({})
    );

    expect(result).toStrictEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const doCommander = vi.fn().mockResolvedValue(new DoCommandResponse({}));
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
    expect(loggedRequest.command?.toJson()).toStrictEqual({ foo: 'bar' });
  });
});

describe('getStatusFromClient', () => {
  it('returns the status as JSON', async () => {
    const getStatusMethod = vi.fn().mockResolvedValue(
      new GetStatusResponse({
        result: Struct.fromJson({ state: 'running' }),
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
      .mockResolvedValue(new GetStatusResponse({}));

    const result = await getStatusFromClient(getStatusMethod, 'test');

    expect(result).toStrictEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const getStatusMethod = vi
      .fn()
      .mockResolvedValue(new GetStatusResponse({}));
    const requestLogger = vi.fn();

    await getStatusFromClient(getStatusMethod, 'test', { requestLogger });

    expect(requestLogger).toHaveBeenCalledOnce();
    const [loggedRequest] = requestLogger.mock.calls[0] as [GetStatusRequest];
    expect(loggedRequest.name).toBe('test');
  });
});
