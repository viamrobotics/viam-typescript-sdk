import { MessageInitShape } from '@bufbuild/protobuf';
import * as navigationApi from '../../gen/service/navigation/v1/navigation_pb';

export type NavigationPosition = MessageInitShape<typeof navigationApi.GetLocationResponseSchema>;
export type NavigationProperties = MessageInitShape<
  typeof navigationApi.GetPropertiesResponseSchema
>;
export type Mode = navigationApi.Mode;
export type Path = MessageInitShape<typeof navigationApi.PathSchema>;
export type Waypoint = MessageInitShape<typeof navigationApi.WaypointSchema>;

export const { Mode } = navigationApi;
