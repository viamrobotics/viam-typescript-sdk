import type { MessageInitShape } from '@bufbuild/protobuf';
import { createRouterTransport, type Transport } from '@connectrpc/connect';

import { ResourceNameSchema } from '../../../gen/common/v1/common_pb';
import { OperationSchema, RobotService } from '../../../gen/robot/v1/robot_pb';

export const createMockRobotServiceTransport = (
  resources: MessageInitShape<typeof ResourceNameSchema>[] = [],
  operations: MessageInitShape<typeof OperationSchema>[] = []
): Transport => {
  return createRouterTransport(({ service }) => {
    service(RobotService, {
      resourceNames: () => ({ resources }),
      getOperations: () => ({ operations }),
    });
  });
};
