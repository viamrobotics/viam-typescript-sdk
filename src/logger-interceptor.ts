import type { AnyMessage } from '@bufbuild/protobuf';
import type { Interceptor } from '@connectrpc/connect';

export const loggerInterceptor: Interceptor = (next) => async (req) => {
  if (req.stream) {
    void logEach(req.service.typeName, req.method.name, req.message);
  } else {
    // eslint-disable-next-line no-console
    console.debug(req.service.typeName, req.method.name, req.message.toJson());
  }

  const res = await next(req);

  if (res.stream) {
    void logEach(res.service.typeName, res.method.name, res.message);
  } else {
    // eslint-disable-next-line no-console
    console.debug(res.service.typeName, res.method.name, res.message.toJson());
  }

  return res;
};

const logEach = async (
  typeName: string,
  methodName: string,
  stream: AsyncIterable<AnyMessage>
) => {
  for await (const message of stream) {
    // eslint-disable-next-line no-console
    console.debug(typeName, methodName, message.toJson());
  }
};
