const LOGGERS: Record<string, Logger> = {};

type LogMode = 'raw' | 'formatted';
type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

interface StructuredLog {
  name: string;
  timestamp: string;
  level: Exclude<LogLevel, 'none'>;
  message: string;
  args?: Record<string, unknown>;
  error?: unknown;
}

const LOG_STORAGE_CAPACITY = 10_000;

class LogStorage {
  private readonly buffer: (string | undefined)[] = Array.from({length: LOG_STORAGE_CAPACITY});
  private head = 0;
  private count = 0;

  public push(log: string): void {
    this.buffer[this.head] = log;
    this.head = (this.head + 1) % LOG_STORAGE_CAPACITY;
    if (this.count < LOG_STORAGE_CAPACITY) {
      this.count += 1;
    }
  }

  public async copyToClipboard() {
    const logs = this.getLogs();

    if (logs.length === 0) {
      return 'No logs to copy';
    }

    try {
      await tryClipboardCopy(logs);
      return `Copied ${this.count} log entries to clipboard`;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        'Could not copy to clipboard. Right-click the returned string below and select "Copy string contents".',
        error
      );
      return logs.toString();
    }
  }

  private getLogs(): string {
    if (this.count === 0) {
      return '';
    }

    const lines: string[] = [];
    // When buffer is full, head points to oldest entry
    const start = this.count < LOG_STORAGE_CAPACITY ? 0 : this.head;

    for (let i = 0; i < this.count; i += 1) {
      const index = (start + i) % LOG_STORAGE_CAPACITY;
      const entry = this.buffer[index];
      if (entry !== undefined) {
        lines.push(entry);
      }
    }

    return lines.join('\n');
  }
}

export class Logger {
  public readonly name: string;

  public mode: LogMode = 'formatted';
  public level: LogLevel;

  constructor(name: string) {
    this.name = name;
    LOGGERS[name] = this;

    const persistedMode = getPersistedMode(name);
    if (persistedMode === null) {
      this.mode = 'formatted';
      setPersistedMode(name, 'formatted');
    } else {
      this.mode = persistedMode;
    }

    const persistedLevel = getPersistedLevel(name);
    if (persistedLevel === null) {
      this.level = 'info';
      setPersistedLevel(name, 'info');
    } else {
      this.level = persistedLevel;
    }
  }

  public error(
    message: string,
    error: unknown,
    args?: Record<string, unknown>
  ) {
    this.log({
      level: 'error',
      message,
      error,
      args,
    });
  }

  public warn(message: string, args?: Record<string, unknown>) {
    this.log({
      level: 'warn',
      message,
      args,
    });
  }

  public info(message: string, args?: Record<string, unknown>) {
    this.log({
      level: 'info',
      message,
      args,
    });
  }

  public debug(message: string, args?: Record<string, unknown>) {
    this.log({
      level: 'debug',
      message,
      args,
    });
  }

  public table(label: string, data: Record<string, unknown>) {
    if (this.level === 'none') {
      return;
    }

    const timestamp = new Date().toISOString();

    /* eslint-disable no-console */
    console.groupCollapsed(`${timestamp}    ${this.name}    ${label}`);
    console.table(data);
    console.groupEnd();
    /* eslint-enable no-console */
  }

  private log(log: Omit<StructuredLog, 'name' | 'timestamp'>) {
    if (shouldLog(this.level, log.level)) {
      const output = {
        name: this.name,
        timestamp: new Date().toISOString(),
        ...log,
      };

      if (this.mode === 'raw') {
        printRawLog(output);
      } else {
        printFormattedLog(output);
      }
    }
  }
}

const tryClipboardCopy = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fall through to textarea fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.append(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    textarea.remove();
    return success;
  } catch {
    return false;
  }
};

const isLogLevel = (level: string): level is LogLevel => {
  return ['none', 'error', 'warn', 'info', 'debug'].includes(level);
};

const isLogMode = (mode: string): mode is LogMode => {
  return ['raw', 'formatted'].includes(mode);
};

const getStorage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
};

const getPersistedMode = (name: string): LogMode | null => {
  const storage = getStorage();
  if (storage === null) {
    return null;
  }

  const mode = storage.getItem(`${name}LogMode`);
  if (mode !== null && isLogMode(mode)) {
    return mode;
  }

  return null;
};

const getPersistedLevel = (name: string): LogLevel | null => {
  const storage = getStorage();
  if (storage === null) {
    return null;
  }

  const level = storage.getItem(`${name}LogLevel`);
  if (level !== null && isLogLevel(level)) {
    return level;
  }

  return null;
};

const setPersistedMode = (name: string, mode: LogMode): void => {
  const storage = getStorage();
  if (storage === null) {
    return;
  }

  storage.setItem(`${name}LogMode`, mode);
};

const setPersistedLevel = (name: string, level: LogLevel): void => {
  const storage = getStorage();
  if (storage === null) {
    return;
  }

  storage.setItem(`${name}LogLevel`, level);
};

const setLoggingMode = (mode: string): void => {
  if (!isLogMode(mode)) {
    // eslint-disable-next-line no-console
    console.warn(
      `Invalid logging mode: ${mode}, valid modes are: raw, formatted`
    );
    return;
  }

  for (const logger of Object.values(LOGGERS)) {
    logger.mode = mode;
    setPersistedMode(logger.name, mode);
  }
};

const setLoggingLevel = (level: string): void => {
  if (!isLogLevel(level)) {
    // eslint-disable-next-line no-console
    console.warn(
      `Invalid logging level: ${level}, valid levels are: none, error, warn, info, debug`
    );
    return;
  }

  for (const logger of Object.values(LOGGERS)) {
    logger.level = level;
    setPersistedLevel(logger.name, level);
  }
};

const shouldLog = (current: LogLevel, target: LogLevel): boolean => {
  if (current === 'none') {
    return false;
  }

  if (current === 'error') {
    return target === 'error';
  }

  if (current === 'warn') {
    return ['warn', 'error'].includes(target);
  }

  if (current === 'info') {
    return ['info', 'warn', 'error'].includes(target);
  }

  return true;
};

// Global log storage instance
const logStorage = new LogStorage();

const logToJson = (log: StructuredLog): string => {
  const output: Record<string, unknown> = {
    timestamp: log.timestamp,
    name: log.name,
    level: log.level,
    message: log.message,
    error: log.error,
    args: log.args,
  };

  return JSON.stringify(output);
};

const printRawLog = (log: StructuredLog): void => {
  const jsonLine = logToJson(log);
  logStorage.push(jsonLine);

  // eslint-disable-next-line no-console
  queueMicrotask(console[log.level].bind(console, jsonLine));
};

const replacer = (_: string, value: unknown): unknown => {
  if (value === undefined) {
    return null;
  }

  return value;
};

const ANSI_RESET = '\u001B[0m';
const ANSI_BOLD = '\u001B[1m';
const ANSI_RED = '\u001B[31m';
const ANSI_YELLOW = '\u001B[33m';
const ANSI_BLUE = '\u001B[34m';
const ANSI_BRIGHT_BLACK = '\u001B[90m';

const formatName = (name: string): string => {
  return `${ANSI_BOLD}${name}${ANSI_RESET}`;
};

const formatLevel = (level: Exclude<LogLevel, 'none'>): string => {
  let color = ANSI_BRIGHT_BLACK;
  switch (level) {
    case 'error': {
      color = ANSI_RED;
      break;
    }
    case 'warn': {
      color = ANSI_YELLOW;
      break;
    }
    case 'info': {
      color = ANSI_BLUE;
      break;
    }
    case 'debug': {
      color = ANSI_BRIGHT_BLACK;
      break;
    }
  }
  return `${ANSI_BOLD}${color}${level}${ANSI_RESET}`;
};

const printFormattedLog = (log: StructuredLog): void => {
  const formattedName = formatName(log.name);
  const formattedLevel = formatLevel(log.level);
  let output = `${log.timestamp}    ${formattedName}    ${formattedLevel}    ${log.message}`;

  if (log.error !== undefined) {
    const errorJSON = JSON.stringify(log.error, replacer, ' ');
    output += `    error: ${errorJSON.replaceAll(/[\n\r]/gu, '')}`;
  }

  if (log.args !== undefined) {
    for (const [key, value] of Object.entries(log.args)) {
      const argsJSON = JSON.stringify(value, replacer, ' ');
      output += `    ${key}: ${argsJSON.replaceAll(/[\n\r]/gu, '')}`;
    }
  }

  const jsonLine = logToJson(log);
  logStorage.push(jsonLine);

  // eslint-disable-next-line no-console
  queueMicrotask(console[log.level].bind(console, output));
};

// Expose logging utilities globally in browser environments
if (typeof window !== 'undefined') {
  window.setLoggingMode = setLoggingMode;
  window.setLoggingLevel = setLoggingLevel;
  window.getLogs = async () => {
    return logStorage.copyToClipboard();
  };
}
