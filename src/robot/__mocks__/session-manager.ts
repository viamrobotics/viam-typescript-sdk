import { vi } from 'vitest';
import SessionManager from '../session-manager';
import { createMockTransport } from '../../__mocks__/transports';

export const createMockSessionManager = (
  transport = createMockTransport(),
  getSessionMetadata = vi.fn(),
  reset = vi.fn()
): SessionManager => {
  const sessionManager = new SessionManager('test-host', () => transport);
  sessionManager.getSessionMetadata = getSessionMetadata;
  sessionManager.reset = reset;

  return sessionManager;
};
