import { vi } from 'vitest';

export const createMockPeerConnection = (
  closeFn = vi.fn(),
  addEventListenerFn = vi.fn(),
  removeEventListenerFn = vi.fn(),
  iceConnectionState: RTCIceConnectionState = 'connected',
  getStatsFn = vi.fn().mockResolvedValue(new Map()),
): RTCPeerConnection => {
  return {
    close: closeFn,
    addEventListener: addEventListenerFn,
    removeEventListener: removeEventListenerFn,
    iceConnectionState,
    getStats: getStatsFn,
  } as unknown as RTCPeerConnection;
};

export const createMockDataChannel = (
  closeFn = vi.fn(),
  addEventListenerFn = vi.fn(),
  removeEventListenerFn = vi.fn(),
  readyState: RTCDataChannelState = 'open',
): RTCDataChannel => {
  return {
    close: closeFn,
    addEventListener: addEventListenerFn,
    removeEventListener: removeEventListenerFn,
    readyState,
  } as unknown as RTCDataChannel;
};
