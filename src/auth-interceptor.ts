import type { Interceptor } from '@connectrpc/connect';

export const authInterceptor: (accessToken: string) => Interceptor =
  (accessToken: string) => (next) => async (req) => {
    req.header.set('Authorization', `Bearer ${accessToken}`);
    return next(req);
  };
