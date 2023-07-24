import { GeoObstacle } from '../../gen/common/v1/common_pb';
import type { ModeMap } from '../../gen/service/navigation/v1/navigation_pb';
import { Waypoint } from '../../gen/service/navigation/v1/navigation_pb';
import type { GeoPoint, Resource, StructType } from '../../types';

export interface Navigation extends Resource {
  getMode: (extra?: StructType) => Promise<ModeMap[keyof ModeMap]>;
  setMode: (mode: ModeMap[keyof ModeMap], extra?: StructType) => Promise<void>;
  getLocation: (extra?: StructType) => Promise<GeoPoint>;
  getWayPoints: (extra?: StructType) => Promise<Array<Waypoint>>;
  addWayPoint: (location: GeoPoint, extra?: StructType) => Promise<void>;
  removeWayPoint: (id: string, extra?: StructType) => Promise<void>;
  getObstacles: (extra?: StructType) => Promise<Array<GeoObstacle>>;
}
