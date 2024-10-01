import type { PlainMessage } from '@bufbuild/protobuf';
import * as navigationApi from '../../gen/service/navigation/v1/navigation_pb';

export type NavigationPosition = navigationApi.GetLocationResponse;
export type NavigationProperties = navigationApi.GetPropertiesResponse;
export type Mode = navigationApi.Mode;
export type Path = PlainMessage<navigationApi.Path>;
export type Waypoint = PlainMessage<navigationApi.Waypoint>;

export const {
  GetLocationResponse: NavigationPosition,
  GetPropertiesResponse: NavigationProperties,
  Mode,
  Path,
  Waypoint,
} = navigationApi;
