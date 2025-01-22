import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { ComponentConfig } from '../../gen/app/v1/robot_pb';

/** A service that enables various computer vision algorithms */
export interface Discovery extends Resource {
  /**
   * Get a list of component configs of all discovered components.
   *
   * @param discoveryName - The name of the discovery service.
   * @returns - The list of ComponentConfigs.
   */
  discoverResources: (extra?: Struct) => Promise<ComponentConfig[]>;
}
