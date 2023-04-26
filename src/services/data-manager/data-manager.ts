import type { Extra } from '../../types';

export interface DataManager {
  sync: (extra?: Extra) => Promise<void>;
}
