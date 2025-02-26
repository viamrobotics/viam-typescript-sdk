import type {
  AnyMessage,
  Message,
  MethodInfo,
  PartialMessage,
  ServiceType,
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
import SessionManager from './session-manager';

export default class SessionTransport implements Transport {
  constructor(
    protected readonly deferredTransport: () => Transport,
    protected readonly sessionManager: SessionManager
  ) { }

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
    I extends Message<I> = AnyMessage,
    O extends Message<O> = AnyMessage,
  >(
    service: ServiceType,
    method: MethodInfo<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    message: PartialMessage<I>,
    contextValues?: ContextValues
  ): Promise<UnaryResponse<I, O>> {
    const newHeaders = cloneHeaders(header);
    const methodPath = `/${service.typeName}/${method.name}`;
    if (SessionManager.heartbeatMonitoredMethods.has(methodPath)) {
      const md = await this.getSessionMetadata();
      for (const [key, value] of md) {
        newHeaders.set(key, value);
      }
    }
    return this.deferredTransport().unary(
      service,
      method,
      signal,
      timeoutMs,
      newHeaders,
      message,
      contextValues
    );
  }

  public async stream<
    I extends Message<I> = AnyMessage,
    O extends Message<O> = AnyMessage,
  >(
    service: ServiceType,
    method: MethodInfo<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    input: AsyncIterable<PartialMessage<I>>,
    contextValues?: ContextValues
  ): Promise<StreamResponse<I, O>> {
    const newHeaders = cloneHeaders(header);
    const methodPath = `/${service.typeName}/${method.name}`;
    if (SessionManager.heartbeatMonitoredMethods.has(methodPath)) {
      const md = await this.getSessionMetadata();
      for (const [key, value] of md) {
        newHeaders.set(key, value);
      }
    }
    return this.deferredTransport().stream(
      service,
      method,
      signal,
      timeoutMs,
      newHeaders,
      input,
      contextValues
    );
  }
}
