import { createPromiseClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { AuthService } from './gen/proto/rpc/v1/auth_connect';
import { authInterceptor } from './auth-interceptor';
import { loggerInterceptor } from './logger-interceptor';

interface DialDirectConf {
  host: string;
  authEntity?: string;
  credential?: { type: string; payload: string };
}

export const dialDirect = async ({
  host,
  authEntity,
  credential,
}: DialDirectConf) => {
  const authTransport = createGrpcWebTransport({
    baseUrl: host,
    interceptors: [loggerInterceptor],
  });

  const auth = createPromiseClient(AuthService, authTransport);
  const authRes = await auth.authenticate({
    entity: authEntity,
    credentials: credential,
  });

  return createGrpcWebTransport({
    baseUrl: host,
    interceptors: [authInterceptor(authRes.accessToken), loggerInterceptor],
  });
};
