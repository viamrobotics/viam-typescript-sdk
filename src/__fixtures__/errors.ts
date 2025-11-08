import { Code, ConnectError } from '@connectrpc/connect';

// Non-retryable ConnectError codes
export const unauthenticatedError = new ConnectError(
  'User is not authenticated',
  Code.Unauthenticated
);

export const permissionDeniedError = new ConnectError(
  'Permission denied to access resource',
  Code.PermissionDenied
);

export const invalidArgumentError = new ConnectError(
  'Invalid argument provided',
  Code.InvalidArgument
);

export const notFoundError = new ConnectError(
  'Resource not found',
  Code.NotFound
);

export const failedPreconditionError = new ConnectError(
  'Failed precondition check',
  Code.FailedPrecondition
);

export const outOfRangeError = new ConnectError(
  'Value out of range',
  Code.OutOfRange
);

export const unimplementedError = new ConnectError(
  'Method not implemented',
  Code.Unimplemented
);

// Retryable ConnectError codes
export const unavailableError = new ConnectError(
  'Service unavailable',
  Code.Unavailable
);

export const deadlineExceededError = new ConnectError(
  'Deadline exceeded',
  Code.DeadlineExceeded
);

export const abortedError = new ConnectError('Operation aborted', Code.Aborted);

export const internalError = new ConnectError(
  'Internal server error',
  Code.Internal
);

export const unknownError = new ConnectError(
  'Unknown error occurred',
  Code.Unknown
);

// Non-retryable standard errors
export const configurationError = new Error('Invalid configuration provided');

export const cannotDialError = new Error(
  'cannot dial "example.com" directly, please use a local url instead.'
);

// Retryable standard errors
export const networkError = new Error('Network connection failed');

export const timeoutError = new Error('Connection timed out');
