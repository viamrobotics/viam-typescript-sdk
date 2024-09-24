import { grpc } from '@improbable-eng/grpc-web';
import {
  Metadata,
  PacketMessage,
  RequestHeaders,
  RequestMessage,
  Response,
  ResponseHeaders,
  ResponseMessage,
  ResponseTrailers,
  Stream,
  Strings,
} from '../gen/proto/rpc/webrtc/v1/grpc_pb';
import { BaseStream } from './base-stream';
import type { ClientChannel } from './client-channel';
import { GRPCError } from './grpc-error';

// see golang/client_stream.go
const maxRequestMessagePacketDataSize = 16_373;

export class ClientStream extends BaseStream implements grpc.Transport {
  private readonly channel: ClientChannel;
  private headersReceived = false;
  private trailersReceived = false;

  constructor(
    channel: ClientChannel,
    stream: Stream,
    onDone: (id: number) => void,
    opts: grpc.TransportOptions
  ) {
    super(stream, onDone, opts);
    this.channel = channel;
  }

  public start(metadata: grpc.Metadata) {
    const method = `/${this.opts.methodDefinition.service.serviceName}/${this.opts.methodDefinition.methodName}`;
    const requestHeaders = new RequestHeaders();
    requestHeaders.setMethod(method);
    requestHeaders.setMetadata(fromGRPCMetadata(metadata));

    try {
      this.channel.writeHeaders(this.stream, requestHeaders);
    } catch (error) {
      console.error('error writing headers', error);
      this.closeWithRecvError(error as Error);
    }
  }

  public sendMessage(msgBytes?: Uint8Array) {
    // skip frame header bytes
    if (msgBytes) {
      this.writeMessage(false, msgBytes.slice(5));
      return;
    }
    this.writeMessage(false, undefined);
  }

  public resetStream() {
    try {
      this.channel.writeReset(this.stream);
    } catch (error) {
      console.error('error writing reset', error);
      this.closeWithRecvError(error as Error);
    }
  }

  public finishSend() {
    if (!this.opts.methodDefinition.requestStream) {
      return;
    }
    this.writeMessage(true, undefined);
  }

  public cancel() {
    if (this.closed) {
      return;
    }
    this.resetStream();
  }

  private writeMessage(eos: boolean, msgBytes?: Uint8Array) {
    try {
      let remMsgBytes = msgBytes;
      if (!remMsgBytes || remMsgBytes.length === 0) {
        const packet = new PacketMessage();
        packet.setEom(true);
        const requestMessage = new RequestMessage();
        requestMessage.setHasMessage(Boolean(remMsgBytes));
        requestMessage.setPacketMessage(packet);
        requestMessage.setEos(eos);
        this.channel.writeMessage(this.stream, requestMessage);
        return;
      }

      while (remMsgBytes.length > 0) {
        const amountToSend = Math.min(
          remMsgBytes.length,
          maxRequestMessagePacketDataSize
        );
        const packet = new PacketMessage();
        packet.setData(remMsgBytes.slice(0, amountToSend));
        remMsgBytes = remMsgBytes.slice(amountToSend);
        if (remMsgBytes.length === 0) {
          packet.setEom(true);
        }
        const requestMessage = new RequestMessage();
        requestMessage.setHasMessage(Boolean(remMsgBytes));
        requestMessage.setPacketMessage(packet);
        requestMessage.setEos(eos);
        this.channel.writeMessage(this.stream, requestMessage);
      }
    } catch (error) {
      console.error('error writing message', error);
      this.closeWithRecvError(error as Error);
    }
  }

  public onResponse(resp: Response) {
    switch (resp.getTypeCase()) {
      case Response.TypeCase.HEADERS: {
        if (this.headersReceived) {
          this.closeWithRecvError(new Error('headers already received'));
          return;
        }
        if (this.trailersReceived) {
          this.closeWithRecvError(new Error('headers received after trailers'));
          return;
        }
        const respHeaders = resp.getHeaders();
        if (respHeaders === undefined) {
          this.closeWithRecvError(new Error('no headers in response'));
          return;
        }
        this.processHeaders(respHeaders);
        break;
      }
      case Response.TypeCase.MESSAGE: {
        if (!this.headersReceived) {
          this.closeWithRecvError(new Error('headers not yet received'));
          return;
        }
        if (this.trailersReceived) {
          this.closeWithRecvError(new Error('headers received after trailers'));
          return;
        }
        const respMessage = resp.getMessage();
        if (respMessage === undefined) {
          this.closeWithRecvError(new Error('no message in response'));
          return;
        }
        this.processMessage(respMessage);
        break;
      }
      case Response.TypeCase.TRAILERS: {
        const respTrailers = resp.getTrailers();
        if (respTrailers === undefined) {
          this.closeWithRecvError(new Error('no trailers in response'));
          return;
        }
        this.processTrailers(respTrailers);
        break;
      }
      default: {
        console.error('unknown response type', resp.getTypeCase());
        break;
      }
    }
  }

  private processHeaders(headers: ResponseHeaders) {
    this.headersReceived = true;
    this.opts.onHeaders(toGRPCMetadata(headers.getMetadata()), 200);
  }

  private processMessage(msg: ResponseMessage) {
    const pktMsg = msg.getPacketMessage();
    if (!pktMsg) {
      return;
    }
    const result = super.processPacketMessage(pktMsg);
    if (!result) {
      return;
    }
    const chunk = new ArrayBuffer(result.length + 5);
    new DataView(chunk, 1, 4).setUint32(0, result.length, false);
    new Uint8Array(chunk, 5).set(result);
    this.opts.onChunk(new Uint8Array(chunk));
  }

  private processTrailers(trailers: ResponseTrailers) {
    this.trailersReceived = true;
    const headers = toGRPCMetadata(trailers.getMetadata());
    let statusCode;
    let statusMessage;
    const status = trailers.getStatus();
    if (status) {
      statusCode = status.getCode();
      statusMessage = status.getMessage();
      headers.set('grpc-status', `${status.getCode()}`);
      headers.set('grpc-message', status.getMessage());
    } else {
      statusCode = 0;
      headers.set('grpc-status', '0');
      statusMessage = '';
    }

    const headerBytes = headersToBytes(headers);
    const chunk = new ArrayBuffer(headerBytes.length + 5);
    new DataView(chunk, 0, 1).setUint8(0, 128);
    new DataView(chunk, 1, 4).setUint32(0, headerBytes.length, false);
    new Uint8Array(chunk, 5).set(headerBytes);
    this.opts.onChunk(new Uint8Array(chunk));
    if (statusCode === 0) {
      this.closeWithRecvError();
      return;
    }
    this.closeWithRecvError(new GRPCError(statusCode, statusMessage));
  }
}

// from https://github.com/improbable-eng/grpc-web/blob/6fb683f067bd56862c3a510bc5590b955ce46d2a/ts/src/ChunkParser.ts#L22
export const encodeASCII = (input: string): Uint8Array => {
  const encoded = new Uint8Array(input.length);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i !== input.length; i++) {
    // eslint-disable-next-line unicorn/prefer-code-point
    const charCode = input.charCodeAt(i);
    if (!isValidHeaderAscii(charCode)) {
      throw new Error('Metadata contains invalid ASCII');
    }
    encoded[i] = charCode;
  }
  return encoded;
};

const isAllowedControlChars = (char: number) =>
  char === 0x9 || char === 0xa || char === 0xd;

const isValidHeaderAscii = (val: number): boolean => {
  return isAllowedControlChars(val) || (val >= 0x20 && val <= 0x7e);
};

const headersToBytes = (headers: grpc.Metadata): Uint8Array => {
  let asString = '';
  // eslint-disable-next-line unicorn/no-array-for-each
  headers.forEach((key: string, values: string[]) => {
    asString += `${key}: ${values.join(', ')}\r\n`;
  });
  return encodeASCII(asString);
};

// from https://github.com/jsmouret/grpc-over-webrtc/blob/45cd6d6cf516e78b1e262ea7aa741bc7a7a93dbc/client-improbable/src/grtc/webrtcclient.ts#L7
const fromGRPCMetadata = (metadata?: grpc.Metadata): Metadata | undefined => {
  if (!metadata) {
    return undefined;
  }
  const result = new Metadata();
  const md = result.getMdMap();
  // eslint-disable-next-line unicorn/no-array-for-each
  metadata.forEach((key: string, values: string[]) => {
    const strings = new Strings();
    strings.setValuesList(values);
    md.set(key, strings);
  });
  if (result.getMdMap().getLength() === 0) {
    return undefined;
  }
  return result;
};

const toGRPCMetadata = (metadata?: Metadata): grpc.Metadata => {
  const result = new grpc.Metadata();
  if (metadata) {
    for (const [key, entry] of metadata.getMdMap().entries()) {
      result.append(key, entry.getValuesList());
    }
  }
  return result;
};
