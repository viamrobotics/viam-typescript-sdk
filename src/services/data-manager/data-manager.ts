import type { StructType } from '../../types';

export interface DataManager {
  sync: (extra?: StructType) => Promise<void>;
}
