import type {
  DescMessage,
  DescMethodStreaming,
  DescMethodUnary,
  MessageInitShape,
} from '@bufbuild/protobuf';
import {
  Code,
  ConnectError,
  type ContextValues,
  type StreamResponse,
  type Transport,
  type UnaryResponse,
} from '@connectrpc/connect';

import { cloneHeaders } from '../rpc/dial';
import { clientHeaders } from '../utils';
import SessionManager from './session-manager';

export default class SessionTransport implements Transport {
  constructor(
    protected readonly deferredTransport: () => Transport,
    protected readonly sessionManager: SessionManager
  ) {}

  private async getSessionMetadata(): Promise<Headers> {
    try {
      return await this.sessionManager.getSessionMetadata();
    } catch (error) {
      if (
        error instanceof ConnectError &&
        error.code === Code.InvalidArgument &&
        error.message === 'SESSION_EXPIRED'
      ) {
        this.sessionManager.reset();
      }
      throw error;
    }
  }

  public async unary<
    I extends DescMessage = DescMessage,
    O extends DescMessage = DescMessage,
  >(
    method: DescMethodUnary<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    message: MessageInitShape<I>,
    contextValues?: ContextValues
  ): Promise<UnaryResponse<I, O>> {
    const newHeaders = cloneHeaders(header);
    const methodPath = `/${method.parent.typeName}/${method.name}`;

    for (const [key, value] of clientHeaders) {
      newHeaders.set(key, value);
    }

    if (SessionManager.heartbeatMonitoredMethods[methodPath] ?? false) {
      const md = await this.getSessionMetadata();
      for (const [key, value] of md) {
        newHeaders.set(key, value);
      }
    }
    return this.deferredTransport().unary(
      method,
      signal,
      timeoutMs,
      newHeaders,
      message,
      contextValues
    );
  }

  public async stream<
    I extends DescMessage = DescMessage,
    O extends DescMessage = DescMessage,
  >(
    method: DescMethodStreaming<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    input: AsyncIterable<MessageInitShape<I>>,
    contextValues?: ContextValues
  ): Promise<StreamResponse<I, O>> {
    const newHeaders = cloneHeaders(header);
    const methodPath = `/${method.parent.typeName}/${method.name}`;

    for (const [key, value] of clientHeaders) {
      newHeaders.set(key, value);
    }

    if (SessionManager.heartbeatMonitoredMethods[methodPath] ?? false) {
      const md = await this.getSessionMetadata();
      for (const [key, value] of md) {
        newHeaders.set(key, value);
      }
    }
    return this.deferredTransport().stream(
      method,
      signal,
      timeoutMs,
      newHeaders,
      input,
      contextValues
    );
  }
}
