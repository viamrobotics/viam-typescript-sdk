import { EventDispatcher } from './events';
import type { ResponseStream } from './gen/robot/v1/robot_pb_service';

export class ViamResponseStream<T> extends EventDispatcher {
  private stream: ResponseStream<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(stream: ResponseStream<any>) {
    super();
    this.stream = stream;
  }

  override on(
    type: string,
    handler: (message: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  ): ResponseStream<T> {
    super.on(type, handler);
    return this;
  }

  cancel(): void {
    this.listeners = {};
    this.stream.cancel();
  }
}
