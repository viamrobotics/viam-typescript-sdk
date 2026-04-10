import type { ComponentConfig } from '../../gen/app/v1/robot_pb';
import type { JsonObject, Resource } from '../../types';

/** A service that enables various computer vision algorithms */
export interface Discovery extends Resource {
  /**
   * Get a list of component configs of all discovered components.
   *
   * @param discoveryName - The name of the discovery service.
   * @returns - The list of ComponentConfigs.
   */
  discoverResources: (extra?: JsonObject) => Promise<ComponentConfig[]>;
}
