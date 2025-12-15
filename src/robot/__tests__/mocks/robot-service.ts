import { createRouterTransport, type Transport } from '@connectrpc/connect';
import { RobotService } from '../../../gen/robot/v1/robot_connect';
import type { PartialMessage } from '@bufbuild/protobuf';
import type { Operation } from '../../../gen/robot/v1/robot_pb';
import type { ResourceName } from '../../../gen/common/v1/common_pb';

export const createMockRobotServiceTransport = (
  resources: PartialMessage<ResourceName>[] = [],
  operations: PartialMessage<Operation>[] = []
): Transport => {
  return createRouterTransport(({ service }) => {
    service(RobotService, {
      resourceNames: () => ({ resources }),
      getOperations: () => ({ operations }),
    });
  });
};
