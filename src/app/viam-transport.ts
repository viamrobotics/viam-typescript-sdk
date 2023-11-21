import { grpc } from '@improbable-eng/grpc-web';
import { dialDirect, type DialOptions } from '@viamrobotics/rpc/src/dial';

import { AuthenticateRequest, Credentials } from '../gen/proto/rpc/v1/auth_pb';
import { AuthServiceClient } from '../gen/proto/rpc/v1/auth_pb_service';

/**
 * Get a Viam Transport Factory after getting the accessToken.
 *
 * In dialOpts.credentials, the credential type cannot be a robot secret. The
 * credential type to use would preferably be the organization api key.
 */
export const createViamTransportFactory = async (
  serviceHost: string,
  dialOpts: DialOptions
): Promise<grpc.TransportFactory> => {
  const transportFactory = await dialDirect(serviceHost);

  // if a token is provided, create a transport factory that uses it
  let accessToken: string;
  if (dialOpts.credentials && dialOpts.credentials.type === 'access-token') {
    accessToken = dialOpts.credentials.payload;
    console.debug('Using provided token', accessToken);
    return (opts: grpc.TransportOptions): ViamTransport => {
      return new ViamTransport(transportFactory, opts, accessToken);
    };
  }

  console.debug('need to fetch access token');

  /**
   * If a token is not provided, we need to obtain one with either a
   * 'robot-location-secret' or an 'api-key'
   */
  const authClient = new AuthServiceClient(serviceHost, {
    transport: transportFactory,
  });
  if (!dialOpts.credentials) {
    throw new Error(`credential cannot be none`);
  } else if (dialOpts.credentials.type === 'robot-secret') {
    throw new Error(
      `credential type cannot be 'robot-secret'. Must be either 'robot-location-secret' or 'api-key'.`
    );
  } else if (!dialOpts.authEntity) {
    throw new Error(
      `auth entity cannot be null, undefined, or an empty value.`
    );
  }

  const entity = dialOpts.authEntity;
  const creds = new Credentials();
  creds.setType(dialOpts.credentials.type);
  creds.setPayload(dialOpts.credentials.payload);

  const req = new AuthenticateRequest();
  req.setEntity(entity);
  req.setCredentials(creds);

  accessToken = await new Promise<string>((resolve, reject) => {
    authClient.authenticate(req, new grpc.Metadata(), (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response?.getAccessToken().toString() ?? '');
    });
  });

  console.debug('Using fetched token', accessToken);
  return (opts: grpc.TransportOptions): ViamTransport => {
    return new ViamTransport(transportFactory, opts, accessToken);
  };
};

export class ViamTransport implements grpc.Transport {
  private accessToken: string;
  protected readonly transport: grpc.Transport;

  constructor(
    transportFactory: grpc.TransportFactory,
    opts: grpc.TransportOptions,
    accessToken: string
  ) {
    this.transport = transportFactory(opts);
    this.accessToken = accessToken;
  }

  public start(metadata: grpc.Metadata): void {
    metadata.set('authorization', `Bearer ${this.accessToken}`);
    this.transport.start(metadata);
  }

  public sendMessage(msgBytes: Uint8Array): void {
    this.transport.sendMessage(msgBytes);
  }

  public finishSend(): void {
    this.transport.finishSend();
  }

  public cancel(): void {
    this.transport.cancel();
  }
}
