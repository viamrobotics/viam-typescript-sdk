import type { Extra } from '../../types';


export interface DataManager {
    Sync: (extra?: Extra) => Promise<void>;
}
  