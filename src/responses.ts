import { EventDispatcher } from './events';
import type { ResponseStream as ProtoResponseStream } from './gen/robot/v1/robot_pb_service';

export class ResponseStream<T> extends EventDispatcher {
  private stream: ProtoResponseStream<any>;

  constructor(stream: ProtoResponseStream<any>) {
    super();
    this.stream = stream;
  }

  override on(
    type: string,
    handler: (message: any) => void
  ): ResponseStream<T> {
    super.on(type, handler);
    return this;
  }

  cancel(): void {
    this.listeners = {};
    this.stream.cancel();
  }
}
