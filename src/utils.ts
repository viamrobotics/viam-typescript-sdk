import {
  Struct,
  type JsonValue,
  type PartialMessage,
} from '@bufbuild/protobuf';
import type { CallOptions } from '@connectrpc/connect';
import { apiVersion } from './api-version';
import { DoCommandRequest, DoCommandResponse } from './gen/common/v1/common_pb';
import type { Options } from './types';

export const clientHeaders = new Headers({
  'viam-client': `typescript;v${__VERSION__};${apiVersion}`,
});

type doCommand = (
  request: PartialMessage<DoCommandRequest>,
  options?: CallOptions
) => Promise<DoCommandResponse>;

/** Send/Receive an arbitrary command using a resource client */
export const doCommandFromClient = async function doCommandFromClient(
  doCommander: doCommand,
  name: string,
  command: Struct,
  options: Options = {}
): Promise<JsonValue> {
  const request = new DoCommandRequest({
    name,
    command,
  });

  options.requestLogger?.(request);

  const response = await doCommander(request);
  const result = response.result?.toJson();
  if (!result) {
    return {};
  }
  return result;
};

export const enableDebugLogging = (
  key?: string,
  opts?: CallOptions
): CallOptions => {
  opts ??= { headers: {} as Record<string, string> } as CallOptions;
  if (!key) {
    key = '';
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 6; i++) {
      key += letters[Math.floor(Math.random() * 26)];
    }
  }
  (opts.headers as Record<string, string>)['dtname'] = key;
  return opts;
};

export const disableDebugLogging = (opts: CallOptions): void => {
  delete (opts.headers as Record<string, string>)['dtname'];
};

export const addMetadata = (
  key: string,
  value: string,
  opts?: CallOptions
): CallOptions => {
  opts ??= { headers: {} as Record<string, string> } as CallOptions;
  (opts.headers as Record<string, string>)[key] = value;
  return opts;
};

export const deleteMetadata = (opts: CallOptions, key: string): void => {
  delete (opts.headers as Record<string, string>)[key];
};
