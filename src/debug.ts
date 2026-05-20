/**
 * Structured debug logging for the Viam TypeScript SDK.
 *
 * Enable debug logging by calling {@link setDebugLogWriter} before connecting.
 *
 * @example Log connection events to the browser console:
 *
 * ```ts
 * import {
 *   setDebugLogWriter,
 *   createConsoleLogWriter,
 * } from '@viamrobotics/sdk';
 * setDebugLogWriter(createConsoleLogWriter());
 * ```
 *
 * @example Write log entries to a file in Node.js:
 *
 * ```ts
 * import fs from 'node:fs';
 * import { setDebugLogWriter } from '@viamrobotics/sdk';
 * const logFile = fs.createWriteStream('viam-debug.log', { flags: 'a' });
 * setDebugLogWriter((entry) =>
 *   logFile.write(JSON.stringify(entry) + '\n')
 * );
 * ```
 *
 * Logged events:
 *
 * - `dial_started` — a new connection attempt began
 * - `dial_success` — the connection was established; includes `connectionId`
 * - `dial_failed` — the connection attempt failed
 * - `grpc_request` — a gRPC request was sent through a connection
 * - `grpc_response` — a gRPC response was received (includes `error` on failure)
 * - `client_closed` — the client was explicitly closed
 * - `ice_disconnected` — the WebRTC ICE connection entered the Disconnected state
 */

/** A single structured debug log entry emitted by the Viam SDK. */
export interface DebugLogEntry {
  /** The time at which the event occurred. */
  timestamp: Date;
  /**
   * The type of event. One of: `dial_started`, `dial_success`, `dial_failed`,
   * `grpc_request`, `grpc_response`, `client_closed`, `ice_disconnected`.
   */
  event: string;
  /** The ID of the connection this event relates to, when applicable. */
  connectionId?: string;
  [key: string]: unknown;
}

/** A function that receives structured debug log entries from the SDK. */
export type DebugLogWriter = (entry: DebugLogEntry) => void;

let currentWriter: DebugLogWriter | undefined;

/**
 * Set a writer function to receive structured debug log entries from the SDK.
 * Pass `undefined` to disable debug logging.
 *
 * @example
 *
 * ```ts
 * import {
 *   setDebugLogWriter,
 *   createConsoleLogWriter,
 * } from '@viamrobotics/sdk';
 * // Enable:
 * setDebugLogWriter(createConsoleLogWriter());
 * // Disable:
 * setDebugLogWriter(undefined);
 * ```
 */
export const setDebugLogWriter = (writer: DebugLogWriter | undefined): void => {
  currentWriter = writer;
};

/**
 * Returns true if a debug log writer is currently set.
 *
 * @internal
 */
export const isDebugLogEnabled = (): boolean => currentWriter !== undefined;

/**
 * Write a debug log entry if a writer is currently set.
 *
 * @internal
 */
export const writeDebugLog = (
  event: string,
  fields: Record<string, unknown> = {}
): void => {
  if (!currentWriter) {
    return;
  }
  currentWriter({
    timestamp: new Date(),
    event,
    ...fields,
  });
};

/**
 * Returns a {@link DebugLogWriter} that prints each entry to the console as a
 * JSON string, prefixed with `[viam-sdk]`.
 */
const consoleLogWriter: DebugLogWriter = (entry) => {
  // eslint-disable-next-line no-console
  console.debug('[viam-sdk]', JSON.stringify(entry));
};

export const createConsoleLogWriter = (): DebugLogWriter => consoleLogWriter;
