// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createConsoleLogWriter,
  isDebugLogEnabled,
  setDebugLogWriter,
  writeDebugLog,
  type DebugLogEntry,
} from './debug';

describe('debug logging', () => {
  afterEach(() => {
    setDebugLogWriter(undefined);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('writeDebugLog', () => {
    it('does nothing when no writer is set', () => {
      const writer = vi.fn<[DebugLogEntry]>();
      writeDebugLog('test_event', { foo: 'bar' });
      expect(writer).not.toHaveBeenCalled();
    });

    it('calls the writer with event, fields, and a Date timestamp', () => {
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);

      writeDebugLog('test_event', { connectionId: 'abc', extra: 123 });

      expect(writer).toHaveBeenCalledOnce();
      const [entry] = writer.mock.calls[0]!;
      expect(entry.event).toBe('test_event');
      expect(entry.connectionId).toBe('abc');
      expect(entry.extra).toBe(123);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('stops calling the writer after it is cleared', () => {
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      writeDebugLog('first');
      setDebugLogWriter(undefined);
      writeDebugLog('second');
      expect(writer).toHaveBeenCalledOnce();
    });

    it('works with no extra fields', () => {
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      writeDebugLog('bare_event');
      const [entry] = writer.mock.calls[0]!;
      expect(entry.event).toBe('bare_event');
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe('isDebugLogEnabled', () => {
    it('returns false when no writer is set', () => {
      expect(isDebugLogEnabled()).toBe(false);
    });

    it('returns true when a writer is set', () => {
      setDebugLogWriter(vi.fn());
      expect(isDebugLogEnabled()).toBe(true);
    });

    it('returns false after the writer is cleared', () => {
      setDebugLogWriter(vi.fn());
      setDebugLogWriter(undefined);
      expect(isDebugLogEnabled()).toBe(false);
    });
  });

  describe('createConsoleLogWriter', () => {
    it('calls console.debug with [viam-sdk] prefix and JSON-stringified entry', () => {
      const debugSpy = vi.fn<[string, string]>();
      vi.stubGlobal('console', { ...console, debug: debugSpy });
      const writer = createConsoleLogWriter();
      const entry = {
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
        event: 'test',
      };

      writer(entry);

      expect(debugSpy).toHaveBeenCalledWith('[viam-sdk]', JSON.stringify(entry));
    });
  });
});
