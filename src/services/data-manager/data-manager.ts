import type { Resource, StructType } from '../../types';

export interface DataManager extends Resource {
  sync: (extra?: StructType) => Promise<void>;
}
