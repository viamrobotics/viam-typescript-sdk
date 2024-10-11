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
  if (result === undefined) {
    return {};
  }
  return result;
};
