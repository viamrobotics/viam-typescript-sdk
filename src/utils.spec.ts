// @vitest-environment happy-dom

import { JsonObject, Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';

  const createMockDoCommand = (expectedResult: JsonObject) => {
    return vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson(expectedResult),
      })
    );
  };

  it('accepts a Struct command', async () => {
    const mockDoCommand = createMockDoCommand({ status: 'ok' });
    const command = Struct.fromJson({ action: 'test' });

    const result = await doCommandFromClient(mockDoCommand, name, command);

    expect(result).toStrictEqual({ status: 'ok' });
    expect(mockDoCommand).toHaveBeenCalledOnce();
    const [request] = mockDoCommand.mock.calls[0]! as [DoCommandRequest];
    expect(request.name).toBe(name);
    expect(request.command?.toJson()).toStrictEqual({ action: 'test' });
  });

  it('accepts a plain object command', async () => {
    const mockDoCommand = createMockDoCommand({ status: 'ok' });

    const result = await doCommandFromClient(mockDoCommand, name, {
      action: 'test',
      nested: { key: 'value' },
    });

    expect(result).toStrictEqual({ status: 'ok' });
    expect(mockDoCommand).toHaveBeenCalledOnce();
    const [request] = mockDoCommand.mock.calls[0]! as [DoCommandRequest];
    expect(request.name).toBe(name);
    expect(request.command?.toJson()).toStrictEqual({
      action: 'test',
      nested: { key: 'value' },
    });
  });

  it('returns empty object when result is undefined', async () => {
    const mockDoCommand = vi.fn().mockResolvedValue(new DoCommandResponse({}));

    const result = await doCommandFromClient(mockDoCommand, name, {
      action: 'test',
    });

    expect(result).toStrictEqual({});
  });
});
