// Originally from https://github.com/FusionAuth/fusionauth-javascript-sdk-express
// Original License: https://github.com/FusionAuth/fusionauth-javascript-sdk-express?tab=Apache-2.0-1-ov-file#readme

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import webcrypt from 'crypto';
import express from 'express';
import session from 'express-session';
import nocache from 'nocache';

const serverPort = 9000;

// configure Express app and install the JSON middleware for parsing JSON bodies
const app = express();

app.use(bodyParser.json());

app.use(cookieParser());

// configure CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(nocache());

// configure sessions
app.use(
  session({
    secret: '1234567890',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 3600000,
      sameSite: 'lax',
    },
  })
);

// use routesr
app.use(express.static('./dist'));

if (process.env.VITE_AUTH_CLIENT_ID && process.env.VITE_AUTH_CLIENT_SECRET) {
  console.log(
    'running with FusionAuth for client',
    process.env.VITE_AUTH_CLIENT_ID
  );

  const config = {
    clientId: process.env.VITE_AUTH_CLIENT_ID,
    clientSecret: process.env.VITE_AUTH_CLIENT_SECRET,
    fusionAuthBaseUrl: 'https://viam-prod.fusionauth.io',
  };

  app.get('/app/callback', async (req, res) => {
    console.log('accepting request for token exchange');
    const code = req.query.code;
    const codeVerifier = req.cookies.codeVerifier;
    const redirect_uri = `${req.protocol}://${req.get('host')}/app/callback`;

    try {
      // POST request to /oauth2/token endpoint
      const fusionAuthResponse = await fusionAuthClient('/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: getFormURLEncodedPayload({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: redirect_uri,
        }),
      });

      const { access_token, id_token, refresh_token, expires_in } =
        fusionAuthResponse;
      if (!(access_token && refresh_token)) {
        console.log('Either refresh token or access token is missing.');
        res.sendStatus(503);
        return;
      }

      console.log('saving tokens as cookies');
      // save tokens as cookies
      // the access token will be readable by the web app and susceptible
      // to XSS attacks. It may be better to put this in localstorage or
      // to make the web server a proxy to viam.
      setReadableCookie(res, 'app.at', access_token);
      setSecureCookie(res, 'app.rt', refresh_token);

      const expires_in_ms = expires_in * 1000;
      setReadableCookie(res, 'app.at_exp', (Date.now() + expires_in_ms) / 1000);
      setReadableCookie(res, 'codeVerifier', '', 0);
      setReadableCookie(res, 'app.idt', id_token);

      const redirectUrl = generateRedirectUrlFromState(req);

      res.redirect(redirectUrl);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.get('/app/login', async (req, res) => {
    console.log('accepting request for login');

    console.log(`client_id is ${req.query.client_id}`);
    const newState = pushRedirectUrlToState(
      req.query.redirect_uri,
      req.query.state
    );
    console.log(`newState is ${newState}`);
    const code = await generatePKCE();
    setSecureCookie(res, 'codeVerifier', code.code_verifier);
    const token_exchange_uri = `${req.protocol}://${req.get('host')}/app/callback`;

    const queryParams = {
      client_id: req.query.client_id,
      scope: req.query.scope ?? 'openid offline_access',
      response_type: 'code',
      redirect_uri: token_exchange_uri,
      code_challenge: code.code_challenge,
      code_challenge_method: 'S256',
      state: newState,
    };
    const fullUrl = generateAuthorizeUrl(queryParams);

    res.redirect(fullUrl);
  });

  function generateAuthorizeUrl(queryParams) {
    const query = new URLSearchParams(queryParams);
    return `${config.fusionAuthBaseUrl}/oauth2/authorize?${query}`;
  }

  app.get('/app/logout', (req, res) => {
    const idToken = req.cookies['app.idt'];
    console.log('clearing token cookies');
    setSecureCookie(res, 'app.at', '', 0);
    setSecureCookie(res, 'app.rt', '', 0);
    setReadableCookie(res, 'app.at_exp', '', 0);
    setReadableCookie(res, 'app.idt', '', 0);

    const queryParams = {
      post_logout_redirect_uri: req.query.post_logout_redirect_uri,
    };
    if (req.query.client_id) {
      queryParams.client_id = req.query.client_id;
    } else {
      queryParams.id_token_hint = idToken ?? '';
    }

    const fullUrl = generateLogoutUrl(queryParams);

    res.redirect(fullUrl);
  });

  function generateLogoutUrl(queryParams) {
    const query = new URLSearchParams(queryParams);
    return `${config.fusionAuthBaseUrl}/oauth2/logout?${query}`;
  }

  app.get('/app/me', async (req, res) => {
    console.log('In /me...');
    const access_token = req.cookies['app.at'];

    if (!access_token) {
      console.log('Access token missing');
      res.sendStatus(401);
      return;
    }

    try {
      // submit request to get user information
      const user = await fusionAuthClient('/oauth2/userinfo', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      });

      res.status(200).send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.post('/app/refresh', async (req, res) => {
    if (!req.cookies['app.rt']) {
      res.sendStatus(400);
      return;
    }

    try {
      const fusionAuthResponse = await fusionAuthClient('/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: getFormURLEncodedPayload({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: req.cookies['app.rt'],
          access_token: req.cookies['app.at'],
        }),
      });

      const { access_token, id_token, refresh_token, expires_in } =
        fusionAuthResponse;
      if (!(access_token && refresh_token)) {
        res.sendStatus(503);
        return;
      }

      setSecureCookie(res, 'app.at', access_token);
      setSecureCookie(res, 'app.rt', refresh_token);

      const expires_in_ms = expires_in * 1000;
      setReadableCookie(res, 'app.at_exp', (Date.now() + expires_in_ms) / 1000);
      setReadableCookie(res, 'app.idt', id_token);

      res.sendStatus(204);
    } catch (error) {
      res.sendStatus(500);
    }
  });

  app.get('/app/register', async (req, res) => {
    console.log('accepting request for register');

    console.log(`client_id is ${req.query.client_id}`);
    const newState = pushRedirectUrlToState(
      req.query.redirect_uri,
      req.query.state
    );

    const code = await generatePKCE();
    setSecureCookie(res, 'codeVerifier', code.code_verifier);
    const redirect_uri = `${req.protocol}://${req.get('host')}/app/callback`;
    const queryParams = {
      client_id: req.query.client_id,
      scope: req.query.scope ?? 'openid offline_access',
      response_type: 'code',
      redirect_uri: redirect_uri,
      code_challenge: code.code_challenge,
      code_challenge_method: 'S256',
      state: newState,
    };
    const fullUrl = generateRegisterUrl(queryParams);

    res.redirect(fullUrl);
  });

  function generateRegisterUrl(queryParams) {
    const query = new URLSearchParams(queryParams);
    return `${config.fusionAuthBaseUrl}/oauth2/register?${query}`;
  }

  // save and restore redirect_uri base64 encoded onto state
  function generateRedirectUrlFromState(req) {
    console.log(`state is ${req.query.state}`);
    const [encodedUri, savedState] = req.query.state.split(':');
    const redirectUri = Buffer.from(encodedUri, 'base64').toString('ascii');
    const queryParams = {
      state: savedState,
      locale: req.query.locale,
      userState: req.query.userState,
    };
    const query = new URLSearchParams(queryParams);
    return `${redirectUri}?${query}`;
  }

  function pushRedirectUrlToState(client_redirect_uri, client_state) {
    const encodedUri = Buffer.from(client_redirect_uri).toString('base64');
    return encodedUri + ':' + client_state;
  }

  async function generatePKCE() {
    console.log('in generatePKCE');
    const code_verifier = generateRandomString();

    const encoder = new TextEncoder();
    const data = encoder.encode(code_verifier);
    const sha256 = await crypto.subtle.digest('SHA-256', data);

    let str = '';
    const bytes = new Uint8Array(sha256);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[i]);
    }

    const code_challenge = btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return { code_verifier: code_verifier, code_challenge: code_challenge };
  }

  function dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
  }

  function generateRandomString() {
    const array = new Uint32Array(56 / 2);
    crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join('');
  }

  const fusionAuthClient = async (endpoint, options) => {
    try {
      const url = config.fusionAuthBaseUrl + endpoint;
      const rawResponse = await fetch(url, options);

      if (!rawResponse.ok) {
        throw new Error({
          message: await rawResponse.text(),
        });
      }

      const parsedResponse = await parseResponse(rawResponse);
      return parsedResponse;
    } catch (error) {
      throw error;
    }
  };

  const parseResponse = async (response) => {
    let parsed;

    try {
      parsed = await response.json();
    } catch {
      parsed = await response.text();
    }

    return parsed;
  };

  const getFormURLEncodedPayload = (requestBody) => {
    let encoded = [];

    for (let key in requestBody) {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(requestBody[key]);
      encoded.push(`${encodedKey}=${encodedValue}`);
    }

    return encoded.join('&');
  };

  // Note: maxAge is in ms (from express-session)
  function setSecureCookie(res, name, value, maxAge = undefined) {
    const cookieProps = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    };
    if (typeof maxAge !== 'undefined') {
      cookieProps['maxAge'] = maxAge;
    }
    res.cookie(name, value, cookieProps);
  }

  function setReadableCookie(res, name, value, maxAge = undefined) {
    const cookieProps = {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
    };
    if (typeof maxAge !== 'undefined') {
      cookieProps['maxAge'] = maxAge;
    }
    res.cookie(name, value, cookieProps);
  }
} else {
  console.log('running without FusionAuth');
}

// start server
app.listen(serverPort, () =>
  console.log(`FusionAuth example server listening on port ${serverPort}.`)
);
