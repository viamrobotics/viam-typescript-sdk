import { Struct, type JsonValue } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import { doCommandFromClient } from './utils';

describe('doCommandFromClient', () => {
  const name = 'test-resource';

  const makeDoCommander = (result?: Struct) => {
    return vi.fn().mockResolvedValue(new DoCommandResponse({ result }));
  };

  it('accepts a plain object and converts it to a Struct', async () => {
    const command: Record<string, JsonValue> = { foo: 'bar', num: 42 };
    const resultStruct = Struct.fromJson({ response: 'ok' });
    const doCommander = makeDoCommander(resultStruct);

    const result = await doCommandFromClient(doCommander, name, command);

    expect(result).toEqual({ response: 'ok' });
    expect(doCommander).toHaveBeenCalledOnce();

    const [[request]] = doCommander.mock.calls as [[DoCommandRequest]];
    expect(request.name).toBe(name);
    expect(request.command).toBeInstanceOf(Struct);
    expect(request.command?.toJson()).toEqual({ foo: 'bar', num: 42 });
  });

  it('accepts a Struct directly (backwards compatibility)', async () => {
    const command = Struct.fromJson({ legacy: true });
    const resultStruct = Struct.fromJson({ ok: true });
    const doCommander = makeDoCommander(resultStruct);

    const result = await doCommandFromClient(doCommander, name, command);

    expect(result).toEqual({ ok: true });
    expect(doCommander).toHaveBeenCalledOnce();

    const [[request]] = doCommander.mock.calls as [[DoCommandRequest]];
    expect(request.command).toBe(command);
  });

  it('returns empty object when result is undefined', async () => {
    const doCommander = makeDoCommander(undefined);

    const result = await doCommandFromClient(doCommander, name, {
      cmd: 'test',
    });

    expect(result).toEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const doCommander = makeDoCommander(Struct.fromJson({}));
    const requestLogger = vi.fn();

    await doCommandFromClient(
      doCommander,
      name,
      { cmd: 'test' },
      { requestLogger }
    );

    expect(requestLogger).toHaveBeenCalledOnce();
    expect(requestLogger).toHaveBeenCalledWith(expect.any(DoCommandRequest));
  });

  it('handles nested objects in plain object input', async () => {
    const command = {
      outer: { inner: { deep: 'value' } },
      list: [1, 2, 3],
    };
    const doCommander = makeDoCommander(Struct.fromJson({}));

    await doCommandFromClient(doCommander, name, command);

    const [[request]] = doCommander.mock.calls as [[DoCommandRequest]];
    expect(request.command?.toJson()).toEqual({
      outer: { inner: { deep: 'value' } },
      list: [1, 2, 3],
    });
  });
});
