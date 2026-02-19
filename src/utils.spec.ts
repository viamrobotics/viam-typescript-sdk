// @vitest-environment happy-dom

import { Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';
  const resultStruct = Struct.fromJson({ status: 'ok' });

  const mockDoCommand = vi.fn().mockResolvedValue(
    new DoCommandResponse({
      result: resultStruct,
    })
  );

  it('accepts a plain object and converts it to a Struct', async () => {
    const result = await doCommandFromClient(mockDoCommand, name, {
      myCommand: { key: 'value' },
    });
    expect(result).toEqual({ status: 'ok' });

    const request = mockDoCommand.mock.calls[0]![0];
    expect(request.name).toBe(name);
    expect(request.command).toBeInstanceOf(Struct);
    expect(request.command?.toJson()).toEqual({ myCommand: { key: 'value' } });
  });

  it('accepts a Struct directly', async () => {
    const command = Struct.fromJson({ hello: 'world' });
    const result = await doCommandFromClient(mockDoCommand, name, command);
    expect(result).toEqual({ status: 'ok' });

    const request = mockDoCommand.mock.calls[1]![0];
    expect(request.command).toBe(command);
  });

  it('returns empty object when result is undefined', async () => {
    const emptyDoCommand = vi.fn().mockResolvedValue(new DoCommandResponse({}));
    const result = await doCommandFromClient(emptyDoCommand, name, {
      test: true,
    });
    expect(result).toEqual({});
  });
});
