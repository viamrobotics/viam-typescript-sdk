import type { Resource } from '../../types';
import type { GetPositionResponse } from './types';

export interface Slam extends Resource {
  getPosition: () => Promise<GetPositionResponse>;
  getPointCloudMap: () => Promise<Uint8Array>;
  getInternalState: () => Promise<Uint8Array>;
  getLatestMapInfo: () => Promise<Date>;
}
