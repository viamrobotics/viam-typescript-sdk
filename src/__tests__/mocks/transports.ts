import { vi } from 'vitest';
import type { Transport } from '@connectrpc/connect';

export const createMockTransport = (): Transport => {
  return {
    unary: vi.fn(),
    stream: vi.fn(),
  } satisfies Transport;
};
