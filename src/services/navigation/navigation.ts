import { GeoObstacle } from '../../gen/common/v1/common_pb';
import {
  ModeMap,
  Waypoint,
} from '../../gen/service/navigation/v1/navigation_pb';
import { GeoPoint, Resource, StructType } from '../../types';

export interface Navigation extends Resource {
  getMode: (extra?: StructType) => Promise<ModeMap[keyof ModeMap]>;
  setMode: (mode: ModeMap[keyof ModeMap], extra?: StructType) => Promise<null>;
  getLocation: (extra?: StructType) => Promise<GeoPoint>;
  getWayPoints: (extra?: StructType) => Promise<Array<Waypoint>>;
  addWayPoint: (location: GeoPoint, extra?: StructType) => Promise<null>;
  removeWayPoint: (id: string, extra?: StructType) => Promise<null>;
  getObstacles: (extra?: StructType) => Promise<Array<GeoObstacle>>;
}
