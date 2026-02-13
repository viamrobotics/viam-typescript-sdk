// @vitest-environment happy-dom

import { Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';

  const createMockDoCommander = (resultJson: Record<string, unknown> = {}) => {
    return vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson(resultJson),
      })
    );
  };

  it('accepts a plain object and converts it to a Struct', async () => {
    const mockDoCommander = createMockDoCommander({ answer: 42 });

    const result = await doCommandFromClient(mockDoCommander, name, {
      myCommand: 'test',
      nested: { key: 'value' },
    });

    expect(result).toStrictEqual({ answer: 42 });

    const request = mockDoCommander.mock.calls[0]![0] as DoCommandRequest;
    expect(request.name).toBe(name);
    expect(request.command?.toJson()).toStrictEqual({
      myCommand: 'test',
      nested: { key: 'value' },
    });
  });

  it('accepts a Struct directly without conversion', async () => {
    const mockDoCommander = createMockDoCommander({ success: true });
    const command = Struct.fromJson({ fromStruct: true });

    const result = await doCommandFromClient(mockDoCommander, name, command);

    expect(result).toStrictEqual({ success: true });

    const request = mockDoCommander.mock.calls[0]![0] as DoCommandRequest;
    expect(request.command).toBe(command);
  });

  it('returns empty object when response result is undefined', async () => {
    const mockDoCommander = vi
      .fn()
      .mockResolvedValue(new DoCommandResponse({}));

    const result = await doCommandFromClient(mockDoCommander, name, {
      cmd: 'test',
    });

    expect(result).toStrictEqual({});
  });

  it('handles an empty plain object', async () => {
    const mockDoCommander = createMockDoCommander({});

    const result = await doCommandFromClient(mockDoCommander, name, {});

    expect(result).toStrictEqual({});

    const request = mockDoCommander.mock.calls[0]![0] as DoCommandRequest;
    expect(request.command?.toJson()).toStrictEqual({});
  });

  it('invokes the request logger when provided', async () => {
    const mockDoCommander = createMockDoCommander({});
    const requestLogger = vi.fn();

    await doCommandFromClient(
      mockDoCommander,
      name,
      { cmd: 'test' },
      { requestLogger }
    );

    expect(requestLogger).toHaveBeenCalledOnce();
    const loggedRequest = requestLogger.mock.calls[0]![0] as DoCommandRequest;
    expect(loggedRequest.name).toBe(name);
  });
});
