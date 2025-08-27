import type { PlainMessage } from '@bufbuild/protobuf';
import type { Transform } from '../../gen/common/v1/common_pb';

export interface TransformWithUUID extends PlainMessage<Transform> {
  uuidString: string;
}
