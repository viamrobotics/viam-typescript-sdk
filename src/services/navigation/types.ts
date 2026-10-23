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

/**
 * Options for {@link Navigation.navigateRoute}. Set either routeName (a saved route) or waypoints
 * (an inline list).
 */
export interface NavigateRouteOptions {
  /** The name of a saved route. */
  routeName?: string;
  /** An inline list of waypoints. */
  waypoints?: Waypoint[];
  /** The index to start from. Defaults to 0. */
  startIndex?: number;
  /** Start from the nearest waypoint instead, overriding startIndex. */
  startNearest?: boolean;
  /** Loop the route. Defaults to false. */
  loop?: boolean;
  /** With loop, only return once stopped. Defaults to false. */
  wait?: boolean;
}
