import type { PartialMessage } from '@bufbuild/protobuf';
import * as navigationApi from '../../gen/service/navigation/v1/navigation_pb';

export type NavigationPosition =
  PartialMessage<navigationApi.GetLocationResponse>;
export type NavigationProperties =
  PartialMessage<navigationApi.GetPropertiesResponse>;
export type Mode = navigationApi.Mode;
export type Path = PartialMessage<navigationApi.Path>;
export type Waypoint = PartialMessage<navigationApi.Waypoint>;

export const {
  GetLocationResponse: NavigationPosition,
  GetPropertiesResponse: NavigationProperties,
  Mode,
  Path,
  Waypoint,
} = navigationApi;
