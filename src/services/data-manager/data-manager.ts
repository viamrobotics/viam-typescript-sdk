import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

export interface DataManager extends Resource {
  sync: (extra?: Struct) => Promise<void>;
}
