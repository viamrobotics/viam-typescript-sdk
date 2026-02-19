import { Struct, type JsonValue } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';

  const mockDoCommander = vi.fn();

  it('accepts a plain object and converts it to a Struct', async () => {
    const plainObj: Record<string, JsonValue> = {
      myCommand: { key: 'value' },
    };

    const expectedResult = Struct.fromJson({ response: 'ok' });
    mockDoCommander.mockResolvedValueOnce(
      new DoCommandResponse({ result: expectedResult })
    );

    const result = await doCommandFromClient(mockDoCommander, name, plainObj);

    expect(mockDoCommander).toHaveBeenCalledOnce();
    const calledRequest = (
      mockDoCommander.mock.calls[0] as [DoCommandRequest]
    )[0];
    expect(calledRequest.name).toBe(name);
    expect(calledRequest.command?.toJson()).toEqual(plainObj);
    expect(result).toEqual({ response: 'ok' });
  });

  it('accepts a Struct directly without conversion', async () => {
    const struct = Struct.fromJson({ myCommand: { key: 'value' } });

    const expectedResult = Struct.fromJson({ response: 'ok' });
    mockDoCommander.mockResolvedValueOnce(
      new DoCommandResponse({ result: expectedResult })
    );

    const result = await doCommandFromClient(mockDoCommander, name, struct);

    expect(mockDoCommander).toHaveBeenCalled();
    const calledRequest = (
      mockDoCommander.mock.calls[1] as [DoCommandRequest]
    )[0];
    expect(calledRequest.name).toBe(name);
    expect(calledRequest.command).toBe(struct);
    expect(result).toEqual({ response: 'ok' });
  });

  it('returns empty object when result is undefined', async () => {
    mockDoCommander.mockResolvedValueOnce(new DoCommandResponse({}));

    const result = await doCommandFromClient(mockDoCommander, name, {
      ping: true,
    });

    expect(result).toEqual({});
  });
});
