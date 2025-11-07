import type { Transport } from '@connectrpc/connect';
import { vi } from 'vitest';

export const createMockTransport = (): Transport => {
  return {
    unary: vi.fn(),
    stream: vi.fn(),
  } satisfies Transport;
};
