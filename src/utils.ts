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
  const finalOpts = opts ?? { headers: {} as Record<string, string> };
  let finalKey = '';
  if (key) {
    finalKey = key;
  } else {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 6; i += 1) {
      finalKey += letters[Math.floor(Math.random() * 26)];
    }
  }
  (finalOpts.headers as Record<string, string>).dtname = finalKey;
  return finalOpts;
};

export const disableDebugLogging = (opts: CallOptions): void => {
  if (opts.headers) {
    const { dtname, ...remainingHeaders } = opts.headers as Record<
      string,
      string
    >;
    opts.headers = remainingHeaders;
  }
};

export const addMetadata = (
  key: string,
  value: string,
  opts?: CallOptions
): CallOptions => {
  const finalOpts =
    opts ?? ({ headers: {} as Record<string, string> } as CallOptions);
  (finalOpts.headers as Record<string, string>)[key] = value;
  return finalOpts;
};

export const deleteMetadata = (opts: CallOptions, key: string): void => {
  const { [key]: _, ...remainingHeaders } = opts.headers as Record<
    string,
    string
  >;
  opts.headers = remainingHeaders;
};
