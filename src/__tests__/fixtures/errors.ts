import { Code, ConnectError } from '@connectrpc/connect';

// Non-retryable ConnectError factory functions
export const createUnauthenticatedError = () =>
  new ConnectError('User is not authenticated', Code.Unauthenticated);

export const createPermissionDeniedError = () =>
  new ConnectError(
    'Permission denied to access resource',
    Code.PermissionDenied
  );

export const createInvalidArgumentError = () =>
  new ConnectError('Invalid argument provided', Code.InvalidArgument);

export const createNotFoundError = () =>
  new ConnectError('Resource not found', Code.NotFound);

export const createFailedPreconditionError = () =>
  new ConnectError('Failed precondition check', Code.FailedPrecondition);

export const createOutOfRangeError = () =>
  new ConnectError('Value out of range', Code.OutOfRange);

export const createUnimplementedError = () =>
  new ConnectError('Method not implemented', Code.Unimplemented);

export const createAlreadyExistsError = () =>
  new ConnectError('Resource already exists', Code.AlreadyExists);

export const createCanceledError = () =>
  new ConnectError('Operation was canceled', Code.Canceled);

// Retryable ConnectError factory functions
export const createUnavailableError = () =>
  new ConnectError('Service unavailable', Code.Unavailable);

export const createDeadlineExceededError = () =>
  new ConnectError('Deadline exceeded', Code.DeadlineExceeded);

export const createAbortedError = () =>
  new ConnectError('Operation aborted', Code.Aborted);

export const createInternalError = () =>
  new ConnectError('Internal server error', Code.Internal);

export const createUnknownError = () =>
  new ConnectError('Unknown error occurred', Code.Unknown);

// Non-retryable standard error factory functions
export const createConfigurationError = () =>
  new Error('Invalid configuration provided');

export const createCannotDialError = () =>
  new Error(
    'cannot dial "example.com" directly, please use a local url instead.'
  );

// Retryable standard error factory functions
export const createNetworkError = () => new Error('Network connection failed');
export const createTimeoutError = () => new Error('Connection timed out');
