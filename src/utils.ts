import {
  Struct,
  type JsonValue,
  type PartialMessage,
} from '@bufbuild/protobuf';
import type { CallOptions } from '@connectrpc/connect';
import { apiVersion } from './api-version';
import {
  DoCommandRequest,
  DoCommandResponse,
  GetKinematicsRequest,
  GetKinematicsResponse,
  GetGeometriesRequest,
  GetGeometriesResponse,
  Geometry,
  Mesh,
} from './gen/common/v1/common_pb';
import type { Options, StructInput, Vector3 } from './types';
import type { Frame } from './gen/app/v1/robot_pb';

export const clientHeaders = new Headers({
  viam_client: `typescript;v${__VERSION__};${apiVersion}`,
});

type doCommand = (
  request: PartialMessage<DoCommandRequest>,
  options?: CallOptions
) => Promise<DoCommandResponse>;

/** Send/Receive an arbitrary command using a resource client */
export const doCommandFromClient = async function doCommandFromClient(
  doCommander: doCommand,
  name: string,
  command: StructInput,
  options: Options = {},
  callOptions: CallOptions = {}
): Promise<JsonValue> {
  const request = new DoCommandRequest({
    name,
    command: command instanceof Struct ? command : Struct.fromJson(command),
  });

  options.requestLogger?.(request);

  const response = await doCommander(request, callOptions);
  const result = response.result?.toJson();
  if (result === undefined) {
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
  if (key === undefined) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 6; i += 1) {
      finalKey += letters[Math.floor(Math.random() * 26)];
    }
  } else {
    finalKey = key;
  }
  (finalOpts.headers as Record<string, string>).dtname = finalKey;
  return finalOpts;
};

export const disableDebugLogging = (opts: CallOptions): void => {
  if (opts.headers) {
    const { _, ...remainingHeaders } = opts.headers as Record<string, string>;
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

/** Shared type for kinematics return value */
export interface KinematicsData {
  name: string;
  kinematic_param_type: 'SVA' | 'URDF' | 'UNSPECIFIED';
  joints: {
    id: string;
    type: string;
    parent: string;
    axis: Vector3;
    max: number;
    min: number;
  }[];
  links: Frame[];
}

/** Newer kinematics return shape that includes meshes */
export interface GetKinematicsResultWithMeshes {
  kinematicsData: KinematicsData;
  meshesByUrdfFilepath: Record<string, Mesh>;
}

/** Shared type for kinematics return value (legacy or with meshes) */
export type GetKinematicsResult =
  | KinematicsData
  | GetKinematicsResultWithMeshes;

type getKinematics = (
  request: PartialMessage<GetKinematicsRequest>,
  options?: CallOptions
) => Promise<GetKinematicsResponse>;

/** Get kinematics information using a resource client */
export const getKinematicsFromClient = async function getKinematicsFromClient(
  getKinematicsMethod: getKinematics,
  name: string,
  extra: Struct = Struct.fromJson({}),
  callOptions: CallOptions = {}
): Promise<GetKinematicsResult> {
  const request = new GetKinematicsRequest({
    name,
    extra,
  });

  const response = await getKinematicsMethod(request, callOptions);

  const decoder = new TextDecoder('utf8');
  const jsonString = decoder.decode(response.kinematicsData);
  const parsedKinematicsData = JSON.parse(jsonString) as KinematicsData;

  return {
    ...parsedKinematicsData,
    kinematicsData: parsedKinematicsData,
    meshesByUrdfFilepath: response.meshesByUrdfFilepath,
  };
};

type getGeometries = (
  request: PartialMessage<GetGeometriesRequest>,
  options?: CallOptions
) => Promise<GetGeometriesResponse>;

/** Get geometries information using a resource client */
export const getGeometriesFromClient = async function getGeometriesFromClient(
  getGeometriesMethod: getGeometries,
  name: string,
  extra: Struct = Struct.fromJson({}),
  callOptions: CallOptions = {}
): Promise<Geometry[]> {
  const request = new GetGeometriesRequest({
    name,
    extra,
  });

  const response = await getGeometriesMethod(request, callOptions);
  return response.geometries;
};
