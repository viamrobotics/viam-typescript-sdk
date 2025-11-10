import { Code, ConnectError } from '@connectrpc/connect';
import { robotApi } from '../../main';

export const HEARTBEAT_MONITORED_METHOD =
  '/viam.robot.v1.RobotService/GetOperations';

export const NON_HEARTBEAT_MONITORED_METHOD =
  '/viam.robot.v1.RobotService/ResourceNames';

export const withSessionMetadata = new Headers({
  'viam-sid': 'test-session-id-123',
});

export const withoutSessionMetadata = new Headers();
export const sessionExpiredError = new ConnectError(
  'SESSION_EXPIRED',
  Code.InvalidArgument
);

export const otherError = new ConnectError('Some other error', Code.Internal);
export const testMessage = new robotApi.GetOperationsRequest();
export const testHeaders = new Headers({
  'existing-header': 'existing-value',
});
