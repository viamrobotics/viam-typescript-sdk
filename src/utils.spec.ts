import { Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';

  const mockDoCommander = vi.fn();

  it('accepts a plain object and converts it to a Struct', async () => {
    const resultStruct = Struct.fromJson({ status: 'done' });
    mockDoCommander.mockResolvedValueOnce(
      new DoCommandResponse({ result: resultStruct })
    );

    const result = await doCommandFromClient(mockDoCommander, name, {
      cmd: 'test',
      data: 500,
    });

    expect(result).toEqual({ status: 'done' });

    const [[request]] = mockDoCommander.mock.calls as [[DoCommandRequest]];
    expect(request.name).toBe(name);
    expect(request.command).toBeInstanceOf(Struct);
    expect(request.command?.toJson()).toEqual({ cmd: 'test', data: 500 });
  });

  it('accepts a Struct directly', async () => {
    const resultStruct = Struct.fromJson({ ok: true });
    mockDoCommander.mockResolvedValueOnce(
      new DoCommandResponse({ result: resultStruct })
    );

    const command = Struct.fromJson({ myCommand: { key: 'value' } });
    const result = await doCommandFromClient(mockDoCommander, name, command);

    expect(result).toEqual({ ok: true });

    const [[request]] = mockDoCommander.mock.calls as [[DoCommandRequest]];
    expect(request.command).toBe(command);
  });

  it('returns empty object when result is undefined', async () => {
    mockDoCommander.mockResolvedValueOnce(new DoCommandResponse());

    const result = await doCommandFromClient(mockDoCommander, name, {
      ping: true,
    });

    expect(result).toEqual({});
  });
});
