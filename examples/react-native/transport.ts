// Derived from https://raw.githubusercontent.com/connectrpc/examples-es/refs/heads/main/react-native
import {Message, MethodKind} from '@bufbuild/protobuf';

import type {
  AnyMessage,
  MethodInfo,
  PartialMessage,
  ServiceType,
} from '@bufbuild/protobuf';

import type {
  ContextValues,
  StreamRequest,
  StreamResponse,
  Transport,
  UnaryRequest,
  UnaryResponse,
} from '@connectrpc/connect';
import {Code, ConnectError, createContextValues} from '@connectrpc/connect';
import {GrpcWebTransportOptions} from '@connectrpc/connect-web';
import {
  createClientMethodSerializers,
  createMethodUrl,
  createWritableIterable,
  encodeEnvelope,
  runStreamingCall,
  runUnaryCall,
} from '@connectrpc/connect/protocol';
import {
  requestHeader,
  trailerFlag,
  trailerParse,
  validateResponse,
  validateTrailer,
} from '@connectrpc/connect/protocol-grpc-web';

class AbortError extends Error {
  name = 'AbortError';
}

interface FetchXHRResponse {
  status: number;
  headers: Headers;
  body: Uint8Array;
}

function parseHeaders(allHeaders: string): Headers {
  return allHeaders
    .trim()
    .split(/[\r\n]+/)
    .reduce((memo, header) => {
      const [key, value] = header.split(': ');
      memo.append(key, value);
      return memo;
    }, new Headers());
}

function extractDataChunks(initialData: Uint8Array) {
  let buffer = initialData;
  let dataChunks: {flags: number; data: Uint8Array}[] = [];

  while (buffer.byteLength >= 5) {
    let length = 0;
    let flags = buffer[0];

    for (let i = 1; i < 5; i++) {
      length = (length << 8) + buffer[i]; // eslint-disable-line no-bitwise
    }

    const data = buffer.subarray(5, 5 + length);
    buffer = buffer.subarray(5 + length);
    dataChunks.push({flags, data});
  }

  return dataChunks;
}

export function createXHRGrpcWebTransport(
  options: GrpcWebTransportOptions,
): Transport {
  const useBinaryFormat = options.useBinaryFormat ?? true;
  return {
    async unary<
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage,
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: Headers,
      message: PartialMessage<I>,
      contextValues?: ContextValues,
    ): Promise<UnaryResponse<I, O>> {
      const {serialize, parse} = createClientMethodSerializers(
        method,
        useBinaryFormat,
        options.jsonOptions,
        options.binaryOptions,
      );

      return await runUnaryCall<I, O>({
        signal,
        interceptors: options.interceptors,
        req: {
          stream: false,
          service,
          method,
          url: createMethodUrl(options.baseUrl, service, method),
          init: {
            method: 'POST',
            mode: 'cors',
          },
          header: requestHeader(useBinaryFormat, timeoutMs, header, false),
          contextValues: contextValues ?? createContextValues(),
          message,
        },
        next: async (req: UnaryRequest<I, O>): Promise<UnaryResponse<I, O>> => {
          function fetchXHR(): Promise<FetchXHRResponse> {
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();

              xhr.open(req.init.method ?? 'POST', req.url);

              function onAbort() {
                xhr.abort();
              }

              req.signal.addEventListener('abort', onAbort);

              xhr.addEventListener('abort', () => {
                reject(new AbortError('Request aborted'));
              });

              xhr.addEventListener('load', () => {
                resolve({
                  status: xhr.status,
                  headers: parseHeaders(xhr.getAllResponseHeaders()),
                  body: new Uint8Array(xhr.response),
                });
              });

              xhr.addEventListener('error', () => {
                reject(new Error('Network Error'));
              });

              xhr.addEventListener('loadend', () => {
                req.signal.removeEventListener('abort', onAbort);
              });

              xhr.responseType = 'arraybuffer';

              req.header.forEach((value: string, key: string) =>
                xhr.setRequestHeader(key, value),
              );

              xhr.send(encodeEnvelope(0, serialize(req.message)));
            });
          }
          const response = await fetchXHR();

          validateResponse(response.status, response.headers);

          const chunks = extractDataChunks(response.body);

          let trailer: Headers | undefined;
          let message: O | undefined;

          chunks.forEach(({flags, data}) => {
            if (flags === trailerFlag) {
              if (trailer !== undefined) {
                throw 'extra trailer';
              }

              // Unary responses require exactly one response message, but in
              // case of an error, it is perfectly valid to have a response body
              // that only contains error trailers.
              trailer = trailerParse(data);
              return;
            }

            if (message !== undefined) {
              throw 'extra message';
            }

            message = parse(data);
          });

          if (trailer === undefined) {
            throw 'missing trailer';
          }

          validateTrailer(trailer, response.headers);

          if (message === undefined) {
            throw 'missing message';
          }

          return {
            stream: false,
            header: response.headers,
            message,
            trailer,
            service,
            method,
          } satisfies UnaryResponse<I, O>;
        },
      });
    },
    async stream<
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage,
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: Headers,
      input: AsyncIterable<PartialMessage<I>>,
      contextValues?: ContextValues,
    ): Promise<StreamResponse<I, O>> {
      if (method.kind != MethodKind.ServerStreaming) {
        throw 'client streaming not supported; use WebRTC';
      }

      const {serialize, parse} = createClientMethodSerializers(
        method,
        useBinaryFormat,
        options.jsonOptions,
        options.binaryOptions,
      );

      return await runStreamingCall<I, O>({
        signal,
        interceptors: options.interceptors,
        req: {
          stream: true as const,
          service,
          method,
          url: createMethodUrl(options.baseUrl, service, method),
          init: {
            method: 'POST',
            mode: 'cors',
          },
          header: requestHeader(useBinaryFormat, timeoutMs, header, false),
          contextValues: contextValues ?? createContextValues(),
          message: input,
        },
        next: async (
          streamReq: StreamRequest<I, O>,
        ): Promise<StreamResponse<I, O>> => {
          let respStream = createWritableIterable<O>();
          let trailers = new Headers();
          function fetchXHR(): Promise<FetchXHRResponse> {
            let index = 0;
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();

              xhr.responseType = 'arraybuffer';
              function onAbort() {
                xhr.abort();
              }

              streamReq.signal.addEventListener('abort', onAbort);

              xhr.addEventListener('abort', () => {
                reject(new AbortError('Request aborted'));
              });
              xhr.addEventListener('readystatechange', () => {
                if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                  resolve({
                    status: xhr.status,
                    headers: parseHeaders(xhr.getAllResponseHeaders()),
                    body: new Uint8Array(),
                  });
                }
              });
              xhr.addEventListener('loadend', ev => {
                const rawData = new Uint8Array(xhr.response);
                streamReq.signal.removeEventListener('abort', onAbort);

                const chunks = extractDataChunks(rawData);

                let trailer: Headers | undefined;
                let message: O | undefined;

                let respStreamWriteProm: Promise<void> | undefined;
                chunks.forEach(({flags, data}) => {
                  if (flags === trailerFlag) {
                    if (trailer !== undefined) {
                      throw 'extra trailer';
                    }
                    trailer = trailerParse(data);
                    trailer.forEach((value: string, key: string) => {
                      trailers.append(key, value);
                    });
                  } else {
                    respStreamWriteProm = respStreamWriteProm
                      ? respStreamWriteProm
                          .then(() => respStream.write(parse(data)))
                          .catch(console.error) // eslint-disable-line no-console
                      : respStream.write(parse(data)).catch(console.error); // eslint-disable-line no-console
                  }
                });

                if (trailer === undefined) {
                  throw 'missing trailer';
                }

                validateTrailer(trailer, response.headers);

                if (respStreamWriteProm) {
                  respStreamWriteProm.finally(() => {
                    respStream.close();
                  });
                } else {
                  respStream.close();
                }
              });
              xhr.addEventListener('error', () => {
                reject(new Error('Network Error'));
              });

              xhr.open(streamReq.init.method ?? 'POST', streamReq.url);

              streamReq.header.forEach((value: string, key: string) => {
                xhr.setRequestHeader(key, value);
              });

              // This is incomplete since client streaming is not supported
              const sendMessages = async (messages: AsyncIterable<I>) => {
                let count = 0;
                for await (const msg of streamReq.message) {
                  count += 1;
                  xhr.send(encodeEnvelope(0, serialize(msg)));
                }
              };
              sendMessages(streamReq.message).catch(error => {
                console.error('error sending streaming message', error); // eslint-disable-line no-console
              });
            });
          }
          const response = await fetchXHR();

          validateResponse(response.status, response.headers);

          return {
            ...streamReq,
            header: response.headers,
            trailer: trailers,
            message: respStream,
          } satisfies StreamResponse<I, O>;
        },
      });
    },
  };
}
