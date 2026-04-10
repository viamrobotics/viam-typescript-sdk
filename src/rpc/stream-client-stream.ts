import {
  type DescMessage,
  type DescMethodStreaming,
  type MessageShape,
  toBinary,
} from '@bufbuild/protobuf';
import type {
  ContextValues,
  StreamRequest,
  StreamResponse,
} from '@connectrpc/connect';
import { createContextValues } from '@connectrpc/connect';
import {
  createWritableIterable,
  runStreamingCall,
} from '@connectrpc/connect/protocol';

import type {
  ResponseHeaders,
  ResponseTrailers,
} from '../gen/proto/rpc/webrtc/v1/grpc_pb';
import { ClientStream, toGRPCMetadata } from './client-stream';

export class StreamClientStream<
  I extends DescMessage,
  O extends DescMessage,
> extends ClientStream<DescMethodStreaming<I, O>, I, O> {
  private awaitingHeadersResult?: {
    success: (value: Headers) => void;
    failure: (reason?: unknown) => void;
  };

  private gotHeaders = false;

  // trailers will be written to later
  private readonly respStream = createWritableIterable<MessageShape<O>>();
  private readonly trailers: Headers = new Headers();
  private respStreamQueue?: Promise<void>;

  public async run(
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    input: AsyncIterable<MessageShape<I>>,
    contextValues?: ContextValues
  ): Promise<StreamResponse<I, O>> {
    const req = {
      stream: true as const,
      url: '',
      init: {},
      service: this.method.parent,
      method: this.method,
      requestMethod: 'POST',
      header: new Headers(),
      contextValues: contextValues ?? createContextValues(),
      message: input,
    };
    type optParams = Parameters<typeof runStreamingCall<I, O>>[0];
    const opt: optParams = {
      req,
      /**
       * Next is what actually kicks off the request. The run call below will
       * ultimately call this for us.
       */
      next: async (
        streamReq: StreamRequest<I, O>
      ): Promise<StreamResponse<I, O>> => {
        const startRequest = new Promise<Headers>((resolve, reject) => {
          this.awaitingHeadersResult = {
            success: resolve,
            failure: reject,
          };
          this.startRequest(signal);
          this.sendMessages(streamReq.method.input, streamReq.message).catch(
            (error: unknown) => {
              console.error('error sending streaming message', error); // eslint-disable-line no-console
              this.closeWithRecvError();
            }
          );
        });

        const headers = await startRequest;

        return {
          ...streamReq,
          header: headers,
          trailer: this.trailers,
          message: this.respStream,
        } satisfies StreamResponse<I, O>;
      },
    };
    if (signal) {
      opt.signal = signal;
    }
    if (timeoutMs !== undefined) {
      opt.timeoutMs = timeoutMs;
    }

    return runStreamingCall<I, O>(opt);
  }

  protected async sendMessages(
    desc: I,
    messages: AsyncIterable<MessageShape<I>>
  ) {
    for await (const msg of messages) {
      this.sendMessage(toBinary(desc, msg));
    }
    // end of messages
    this.writeMessage(true, undefined);
  }

  protected onHeaders(respHeaders: ResponseHeaders): void {
    this.gotHeaders = true;
    this.awaitingHeadersResult?.success(toGRPCMetadata(respHeaders.metadata));
  }

  protected onTrailers(respTrailers: ResponseTrailers): void {
    if (respTrailers.metadata?.md) {
      for (const key in respTrailers.metadata.md) {
        if (Object.hasOwn(respTrailers.metadata.md, key)) {
          const value = respTrailers.metadata.md[key];
          for (const val of value?.values ?? []) {
            this.trailers.append(key, val);
          }
        }
      }
    }
    this.respStream.close();

    if (!respTrailers.status || respTrailers.status.code === 0) {
      if (this.gotHeaders) {
        return;
      }
      this.awaitingHeadersResult?.success(new Headers());
      return;
    }
    if (this.gotHeaders) {
      // nothing to fail here
      return;
    }
    this.awaitingHeadersResult?.failure(respTrailers.status.message);
  }

  protected onMessage(msgBytes: Uint8Array) {
    const msg = this.parseMessage(msgBytes);
    this.respStreamQueue = this.respStreamQueue
      ? this.respStreamQueue.then(async () => this.respStream.write(msg))
      : this.respStream.write(msg);
    this.respStreamQueue.catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error(
        `error pushing received message into stream; failing: ${String(error)}`
      );
      this.resetStream();
    });
  }
}
