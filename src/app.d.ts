declare global {
  interface Window {
    setLoggingMode: (mode: 'raw' | 'formatted') => void;
    setLoggingLevel: (
      level: 'none' | 'error' | 'warn' | 'info' | 'debug'
    ) => void;
    getLogs: () => Promise<string>;
  }
}

export {};
