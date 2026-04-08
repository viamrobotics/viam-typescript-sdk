import { create } from "@bufbuild/protobuf";
import { type Timestamp, timestampFromDate } from "@bufbuild/protobuf/wkt";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  GetVideoRequestSchema,
  VideoService,
} from "../../gen/service/video/v1/video_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { VideoChunk } from "./types";
import type { Video } from "./video";

/** Convert a Date to a protobuf Timestamp. */
const dateToTimestamp = (date: Date): Timestamp => {
  return timestampFromDate(date);
};

/** Generate a UUID v4. */
const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * A gRPC-web client for a Video service.
 *
 * @group Clients
 */
export class VideoClient implements Video {
  private client: Client<typeof VideoService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(VideoService);
    this.name = name;
    this.options = options;
  }

  async *getVideo(
    startTimestamp?: Date,
    endTimestamp?: Date,
    videoCodec = "",
    videoContainer = "",
    extra = {},
    callOptions = this.callOptions,
  ): AsyncIterable<VideoChunk> {
    const request = create(GetVideoRequestSchema, {
      name: this.name,
      startTimestamp: startTimestamp
        ? dateToTimestamp(startTimestamp)
        : undefined,
      endTimestamp: endTimestamp ? dateToTimestamp(endTimestamp) : undefined,
      videoCodec,
      videoContainer,
      requestId: generateUUID(),
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const stream = this.client.getVideo(request, callOptions);

    // Yield each video chunk as it arrives from the server stream
    for await (const response of stream) {
      yield response;
    }
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions,
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions,
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
