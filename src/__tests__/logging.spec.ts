// @vitest-environment happy-dom

import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Logger } from '../logging';

const flushMicrotasks = async () => {
  await new Promise<void>((resolve) => {
    queueMicrotask(() => {
      resolve();
    });
  });
};

const createMockConsole = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
  table: vi.fn(),
  groupCollapsed: vi.fn(),
  groupEnd: vi.fn(),
});

describe('Logger', () => {
  let mockConsole: ReturnType<typeof createMockConsole>;
  let originalConsole: typeof console;

  beforeEach(() => {
    window.localStorage.clear();
    originalConsole = globalThis.console;
    mockConsole = createMockConsole();
    vi.stubGlobal('console', mockConsole);
  });

  afterEach(() => {
    vi.stubGlobal('console', originalConsole);
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('defaults to formatted mode when no persisted mode', () => {
      const logger = new Logger('TestLogger');
      expect(logger.mode).toBe('formatted');
    });

    it('defaults to info level when no persisted level', () => {
      const logger = new Logger('TestLogger');
      expect(logger.level).toBe('info');
    });

    it('uses persisted mode from localStorage', () => {
      window.localStorage.setItem('PersistedLoggerLogMode', 'raw');
      const logger = new Logger('PersistedLogger');
      expect(logger.mode).toBe('raw');
    });

    it('uses persisted level from localStorage', () => {
      window.localStorage.setItem('PersistedLoggerLogLevel', 'debug');
      const logger = new Logger('PersistedLogger');
      expect(logger.level).toBe('debug');
    });
  });

  describe('log level filtering', () => {
    it.each([
      { level: 'none', error: 0, warn: 0, info: 0, debug: 0 },
      { level: 'error', error: 1, warn: 0, info: 0, debug: 0 },
      { level: 'warn', error: 1, warn: 1, info: 0, debug: 0 },
      { level: 'info', error: 1, warn: 1, info: 1, debug: 0 },
      { level: 'debug', error: 1, warn: 1, info: 1, debug: 1 },
    ] as const)(
      'logs correctly when level is $level',
      async ({ level, error, warn, info, debug }) => {
        const logger = new Logger(`${level}Logger`);
        logger.level = level;

        logger.error('Error message', new Error('test'));
        logger.warn('Warn message');
        logger.info('Info message');
        logger.debug('Debug message');
        await flushMicrotasks();

        expect(mockConsole.error).toHaveBeenCalledTimes(error);
        expect(mockConsole.warn).toHaveBeenCalledTimes(warn);
        expect(mockConsole.info).toHaveBeenCalledTimes(info);
        expect(mockConsole.debug).toHaveBeenCalledTimes(debug);
      }
    );
  });

  describe('raw mode output', () => {
    it('outputs single-line JSON', async () => {
      const logger = new Logger('RawLogger');
      logger.mode = 'raw';

      logger.info('Test message');
      await flushMicrotasks();

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const [output] = mockConsole.info.mock.calls[0] as string[];

      assert(output !== undefined);

      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed.name).toBe('RawLogger');
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Test message');
      expect(typeof parsed.timestamp).toBe('string');
    });

    it('includes error in JSON output', async () => {
      const logger = new Logger('RawErrorLogger');
      logger.mode = 'raw';

      const testError = new Error('Test error');
      logger.error('Error occurred', testError);
      await flushMicrotasks();

      const [output] = mockConsole.error.mock.calls[0] as string[];

      assert(output !== undefined);

      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed.error).toBeDefined();
    });

    it('includes args in JSON output', async () => {
      const logger = new Logger('RawArgsLogger');
      logger.mode = 'raw';
      logger.level = 'debug';

      logger.debug('Test with args', { key1: 'value1', key2: 42 });
      await flushMicrotasks();

      const [output] = mockConsole.debug.mock.calls[0] as string[];

      assert(output !== undefined);

      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed.args).toEqual({ key1: 'value1', key2: 42 });
    });
  });

  describe('formatted mode output', () => {
    it('outputs formatted string with ANSI codes', async () => {
      const logger = new Logger('FormattedLogger');
      logger.mode = 'formatted';

      logger.info('Test message');
      await flushMicrotasks();

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const [output] = mockConsole.info.mock.calls[0] as string[];

      assert(output !== undefined);

      expect(output).toContain('Test message');
      expect(output).toContain('FormattedLogger');
      expect(output).toContain('\u001B[1m');
    });

    it('includes error in formatted output', async () => {
      const logger = new Logger('FormattedErrorLogger');
      logger.mode = 'formatted';

      logger.error('Error occurred', { message: 'Test error' });
      await flushMicrotasks();

      const [output] = mockConsole.error.mock.calls[0] as string[];

      assert(output !== undefined);

      expect(output).toContain('error:');
    });

    it('includes args in formatted output', async () => {
      const logger = new Logger('FormattedArgsLogger');
      logger.mode = 'formatted';

      logger.info('Test with args', { key1: 'value1' });
      await flushMicrotasks();

      const [output] = mockConsole.info.mock.calls[0] as string[];

      assert(output !== undefined);

      expect(output).toContain('key1:');
      expect(output).toContain('value1');
    });
  });

  describe('table method', () => {
    it('calls console.groupCollapsed and console.table', () => {
      const logger = new Logger('TableLogger');
      const data = { row1: { col1: 'a', col2: 'b' } };

      logger.table('Test Label', data);

      expect(mockConsole.groupCollapsed).toHaveBeenCalledTimes(1);
      expect(mockConsole.table).toHaveBeenCalledWith(data);
      expect(mockConsole.groupEnd).toHaveBeenCalledTimes(1);
    });

    it('does not log table when level is none', () => {
      const logger = new Logger('TableNoneLogger');
      logger.level = 'none';

      logger.table('Test Label', { key: 'value' });

      expect(mockConsole.groupCollapsed).not.toHaveBeenCalled();
    });
  });

  describe('window.setLoggingLevel', () => {
    it('sets level for all loggers', () => {
      const logger1 = new Logger('GlobalLevel1');
      const logger2 = new Logger('GlobalLevel2');

      window.setLoggingLevel('debug');

      expect(logger1.level).toBe('debug');
      expect(logger2.level).toBe('debug');
    });

    it('persists level to localStorage for all loggers', () => {
      const logger1 = new Logger('PersistLevel1');
      const logger2 = new Logger('PersistLevel2');

      window.setLoggingLevel('error');

      expect(logger1.name).toBe('PersistLevel1');
      expect(logger2.name).toBe('PersistLevel2');
      expect(window.localStorage.getItem('PersistLevel1LogLevel')).toBe(
        'error'
      );
      expect(window.localStorage.getItem('PersistLevel2LogLevel')).toBe(
        'error'
      );
    });

    it('warns on invalid level and does not change loggers', () => {
      const logger = new Logger('InvalidLevel');
      const originalLevel = logger.level;

      window.setLoggingLevel('invalid' as 'debug');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Invalid logging level: invalid, valid levels are: none, error, warn, info, debug'
      );
      expect(logger.level).toBe(originalLevel);
    });
  });

  describe('window.setLoggingMode', () => {
    it('sets mode for all loggers', () => {
      const logger1 = new Logger('GlobalMode1');
      const logger2 = new Logger('GlobalMode2');

      window.setLoggingMode('raw');

      expect(logger1.mode).toBe('raw');
      expect(logger2.mode).toBe('raw');
    });

    it('persists mode to localStorage for all loggers', () => {
      const logger1 = new Logger('PersistMode1');
      const logger2 = new Logger('PersistMode2');

      window.setLoggingMode('raw');

      expect(logger1.name).toBe('PersistMode1');
      expect(logger2.name).toBe('PersistMode2');
      expect(window.localStorage.getItem('PersistMode1LogMode')).toBe('raw');
      expect(window.localStorage.getItem('PersistMode2LogMode')).toBe('raw');
    });

    it('warns on invalid mode and does not change loggers', () => {
      const logger = new Logger('InvalidMode');
      const originalMode = logger.mode;

      window.setLoggingMode('invalid' as 'raw');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Invalid logging mode: invalid, valid modes are: raw, formatted'
      );
      expect(logger.mode).toBe(originalMode);
    });
  });

  describe('window.getLogs', () => {
    it('returns logs as a JSON Lines string', async () => {
      const logger1 = new Logger('StorageTest1');
      const logger2 = new Logger('StorageTest2');
      logger1.mode = 'raw';
      logger2.mode = 'formatted';

      logger1.info('Message 1');
      logger2.info('Message 2');
      await flushMicrotasks();

      const message = await window.getLogs();

      expect(message).toMatch(/Copied \d+ log entries to clipboard/u);

      const logs = await navigator.clipboard.readText();
      const lines = logs.split('\n');

      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });
});
