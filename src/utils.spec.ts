// @vitest-environment happy-dom

import { Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';

  const createMockDoCommander = (result: Record<string, unknown>) => {
    return vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson(result),
      })
    );
  };

  it('accepts a Struct command', async () => {
    const mockResult = { key: 'value' };
    const doCommander = createMockDoCommander(mockResult);
    const command = Struct.fromJson({ test: 'command' });

    const result = await doCommandFromClient(doCommander, name, command);

    expect(result).toStrictEqual(mockResult);
    const request = doCommander.mock.calls[0][0] as DoCommandRequest;
    expect(request.name).toBe(name);
    expect(request.command?.toJson()).toStrictEqual({ test: 'command' });
  });

  it('accepts a plain object command', async () => {
    const mockResult = { key: 'value' };
    const doCommander = createMockDoCommander(mockResult);

    const result = await doCommandFromClient(doCommander, name, {
      test: 'command',
    });

    expect(result).toStrictEqual(mockResult);
    const request = doCommander.mock.calls[0][0] as DoCommandRequest;
    expect(request.name).toBe(name);
    expect(request.command?.toJson()).toStrictEqual({ test: 'command' });
  });

  it('accepts a plain object with nested values', async () => {
    const mockResult = { status: 'ok' };
    const doCommander = createMockDoCommander(mockResult);
    const command = {
      action: 'move',
      params: { speed: 10, direction: 'forward' },
      tags: ['urgent', 'test'],
    };

    const result = await doCommandFromClient(doCommander, name, command);

    expect(result).toStrictEqual(mockResult);
    const request = doCommander.mock.calls[0][0] as DoCommandRequest;
    expect(request.command?.toJson()).toStrictEqual(command);
  });

  it('returns empty object when response result is undefined', async () => {
    const doCommander = vi.fn().mockResolvedValue(new DoCommandResponse({}));

    const result = await doCommandFromClient(doCommander, name, {
      test: 'command',
    });

    expect(result).toStrictEqual({});
  });
});
