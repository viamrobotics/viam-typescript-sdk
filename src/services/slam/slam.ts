import type { Resource } from '../../types';
import type { GetPositionResponse, Timestamp } from './types';

export interface Slam extends Resource {
  getPosition: () => Promise<GetPositionResponse>;
  getPointCloudMap: () => Promise<Uint8Array>;
  getInternalState: () => Promise<Uint8Array>;
  getLatestMapInfo: () => Promise<Timestamp>;
}
