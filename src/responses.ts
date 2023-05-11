import { EventDispatcher } from './events';
import type { ResponseStream } from './gen/robot/v1/robot_pb_service';

export class ViamResponseStream<T> extends EventDispatcher {
  private stream: ResponseStream<any>;

  constructor(stream: ResponseStream<any>) {
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
