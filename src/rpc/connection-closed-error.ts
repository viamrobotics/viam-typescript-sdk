import { ConnectError } from '@connectrpc/connect';

export class ConnectionClosedError extends Error {
  public override readonly name = 'ConnectionClosedError';

  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ConnectionClosedError.prototype);
  }

  static override isError(error: unknown): error is Error {
    if (
      error instanceof ConnectionClosedError ||
      (error instanceof ConnectError && error.rawMessage === 'closed')
    ) {
      return true;
    }
    if (typeof error === 'string') {
      return error === 'Response closed without headers';
    }
    if (error instanceof Error) {
      return error.message === 'Response closed without headers';
    }
    return false;
  }
}
