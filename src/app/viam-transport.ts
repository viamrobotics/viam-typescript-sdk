import { grpc } from '@improbable-eng/grpc-web';

export class ViamTransport implements grpc.Transport {
  private transportFactory: grpc.TransportFactory;
  private opts: grpc.TransportOptions;
  private metadata = new grpc.Metadata();

  constructor(
    transportFactory: grpc.TransportFactory,
    opts: grpc.TransportOptions,
    accessToken: string
  ) {
    this.transportFactory = transportFactory;
    this.opts = opts;
    this.metadata.set('authorization', `Bearer ${accessToken}`);
  }

  public start(metadata: grpc.Metadata): void {
    this.transportFactory(this.opts).start(metadata);
  }

  public sendMessage(msgBytes: Uint8Array): void {
    this.transportFactory(this.opts).sendMessage(msgBytes);
  }

  public finishSend(): void {
    this.transportFactory(this.opts).finishSend();
  }

  public cancel(): void {
    this.transportFactory(this.opts).cancel();
  }
}
