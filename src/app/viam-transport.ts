import { grpc } from '@improbable-eng/grpc-web';

export class ViamTransport implements grpc.Transport {
  private accessToken: string;
  protected readonly transport: grpc.Transport;

  constructor(
    transportFactory: grpc.TransportFactory,
    opts: grpc.TransportOptions,
    accessToken: string
  ) {
    this.transport = transportFactory(opts);
    this.accessToken = accessToken
  }

  public start(metadata: grpc.Metadata): void {
    metadata.set('authorization', `Bearer ${this.accessToken}`);
    this.transport.start(metadata);
  }

  public sendMessage(msgBytes: Uint8Array): void {
    this.transport.sendMessage(msgBytes);
  }

  public finishSend(): void {
    this.transport.finishSend();
  }

  public cancel(): void {
    this.transport.cancel();
  }
}
