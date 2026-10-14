import type { JsonValue, PlainMessage } from '@bufbuild/protobuf';
import * as navigationApi from '../../gen/service/navigation/v1/navigation_pb';

export type NavigationPosition = PlainMessage<navigationApi.Position>;
export type NavigationLocation = PlainMessage<navigationApi.Location>;
export type NavigationPlan = PlainMessage<navigationApi.Plan>;
export type NavigationProperties = PlainMessage<navigationApi.Properties>;
export type NavigationStatus = PlainMessage<navigationApi.Status>;
export type NavigationCostmap = navigationApi.GetCostmapResponse;
export type GoalStatus = PlainMessage<navigationApi.GoalStatus>;
export type Route = PlainMessage<navigationApi.Route>;
export type Waypoint = PlainMessage<navigationApi.Waypoint>;
export type Zone = PlainMessage<navigationApi.Zone>;
export type GoalState = navigationApi.GoalState;
export type MapType = navigationApi.MapType;
export type NavErrorCode = navigationApi.NavErrorCode;
export type NavMode = navigationApi.NavMode;

/** The kinds of zone a navigation service supports. */
export type ZoneType = 'keepout' | 'speed_limit';

export const {
  Position: NavigationPosition,
  Location: NavigationLocation,
  Plan: NavigationPlan,
  Properties: NavigationProperties,
  Status: NavigationStatus,
  GetCostmapResponse: NavigationCostmap,
  GoalStatus,
  Route,
  Waypoint,
  Zone,
  GoalState,
  MapType,
  NavErrorCode,
  NavMode,
} = navigationApi;

/** Fields to change on a saved location. Omitted fields are left unchanged. */
export interface UpdateLocationOptions {
  position?: NavigationPosition;
  newName?: string;
}

/**
 * Fields to change on a saved route. Omitted fields are left unchanged; an empty `waypoints` array
 * clears the route.
 */
export interface UpdateRouteOptions {
  newName?: string;
  waypoints?: Waypoint[];
}

/** Fields to change on a zone. Omitted fields are left unchanged. */
export interface UpdateZoneOptions {
  type?: ZoneType;
  geometry?: Record<string, JsonValue>;
  /** Max speed in meters/sec. */
  maxSpeed?: number;
  newName?: string;
}

/** Which route to drive and how. Set either `routeName` or `waypoints`. */
export interface NavigateRouteOptions {
  /** A saved route. */
  routeName?: string;
  /** Inline waypoints. */
  waypoints?: Waypoint[];
  /** Waypoint index to start from. Default 0. */
  startIndex?: number;
  /** Start from the nearest waypoint; overrides `startIndex`. */
  startNearest?: boolean;
  /** Repeat the route until canceled. */
  loop?: boolean;
  /** Return only once the route finishes. With `loop`, returns only when stopped. */
  wait?: boolean;
}

export interface GoToOptions {
  /** Return only once the robot arrives. Default true. */
  wait?: boolean;
  linearMPerSec?: number;
}

export interface CostmapOptions {
  /** "auto", "local", or "global". Default "auto". */
  layer?: 'auto' | 'local' | 'global';
  /** Downsample factor. Default 2. */
  stride?: number;
}
