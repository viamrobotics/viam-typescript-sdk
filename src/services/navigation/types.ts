import type { PlainMessage } from '@bufbuild/protobuf';
import * as navigationApi from '../../gen/service/navigation/v1/navigation_pb';

export type Position = PlainMessage<navigationApi.Position>;
export type Location = PlainMessage<navigationApi.Location>;
export type Waypoint = PlainMessage<navigationApi.Waypoint>;
export type Route = PlainMessage<navigationApi.Route>;
export type Zone = PlainMessage<navigationApi.Zone>;
export type Plan = PlainMessage<navigationApi.Plan>;
export type Velocity = PlainMessage<navigationApi.Velocity>;
export type NavError = PlainMessage<navigationApi.NavError>;
export type Progress = PlainMessage<navigationApi.Progress>;
export type RouteProgress = PlainMessage<navigationApi.RouteProgress>;
export type GoalStatus = PlainMessage<navigationApi.GoalStatus>;
export type Status = PlainMessage<navigationApi.Status>;
export type Properties = PlainMessage<navigationApi.Properties>;
export type Costmap = PlainMessage<navigationApi.GetCostmapResponse>;

export type MapType = navigationApi.MapType;
export type GoalState = navigationApi.GoalState;
export type NavMode = navigationApi.NavMode;
export type NavErrorCode = navigationApi.NavErrorCode;

export const { MapType, GoalState, NavMode, NavErrorCode } = navigationApi;
