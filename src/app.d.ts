declare global {
  interface Window {
    setLoggingMode: (mode: import('./logging').LogMode) => void;
    setLoggingModeFor: (
      name: string,
      mode: import('./logging').LogMode
    ) => void;
    setLoggingLevel: (level: import('./logging').LogLevel) => void;
    setLoggingLevelFor: (
      name: string,
      level: import('./logging').LogLevel
    ) => void;
    getLogs: () => Promise<string>;
  }
}

export {};
