import type { Resource } from '../../types';
import type { GetPositionResponse, Timestamp } from './types';

export interface Slam extends Resource {
  getPosition: () => Promise<GetPositionResponse>;
  getPointCloudMap: () => Promise<string | Uint8Array>;
  getInternalState: () => Promise<string | Uint8Array>;
  getLatestMapInfo: () => Promise<Timestamp>;
}
