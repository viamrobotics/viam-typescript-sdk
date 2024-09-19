# React App and Tele-operation Example

This example project allows you to browse your machines and stream a video from a Viam Rover and control its movements with your keyboard or mouse.

## Authentication Setup

There are two authentication options for this app:
1. API key id and secret baked into the frontend
1. OAuth2 via FusionAuth

### API Key

Go to your organization settings and either create or copy the information for an API key listed under "API Keys". The environment variables you'll need in the next step from this are:

```ini
VITE_APP_API_KEY_ID=21d425b4-0aed-49da-82c9-1e9bda895863
VITE_APP_API_KEY_SECRET=somesecret
```

### FusionAuth

For FusionAuth, you'll need to have set up the [Viam CLI](https://docs.viam.com/cli/). Using the CLI, set up an auth app:

```shell
BASE_DEV_URI="http://localhost:5173"
BASE_PROD_URI="http://localhost:9000"
viam auth-app register --application-name my-app --org-id "yourorgid" --redirect-uris "$BASE_DEV_URI,$BASE_PROD_URI,$BASE_DEV_URI/app/callback,$BASE_PROD_URI/app/callback" --origin-uris "$BASE_DEV_URI,$BASE_PROD_URI" --logout-uri "$BASE_DEV_URI"
```

Note: If you want to use Firefox, you'll need a tool like [ngrok](https://ngrok.com/) since Firefox does not allow WebRTC on localhost hosted pages.
You will also need to update the URI list in the command above in addition to using the `VITE_BASE_URI` environment variable (or set it in .env) to use your ngrok (or other proxy) endpoint.

The response will look something like this:

```shell
Info: Successfully registered auth application
{
	"application_id": "98c26d9a-435b-419f-b028-208e8d328e09",
	"application_name": "my-app",
	"client_secret": "somesecret"
}
```

The environment variables you'll need in the next step from this are:

```ini
VITE_AUTH_CLIENT_ID=98c26d9a-435b-419f-b028-208e8d328e09 # the application_id
VITE_AUTH_CLIENT_SECRET=somesecret # the client_secret
```

## Setup

First, install development dependencies for the demo and launch a dev server.

```shell
cd examples/connect-app-teleop-react
npm install
```

The organization id, api key, and or client id/secret fields can be pre-filled from a `.env` file in the `connect-app-teleop-react` directory. You have to set these before running npm start. Refer to the authentication section before for which environment variables to set.

```ini
# examples/connect-app-teleop-react/.env
VITE_AUTH_CLIENT_ID=98c26d9a-435b-419f-b028-208e8d328e09
VITE_AUTH_CLIENT_SECRET=somesecret
```

```shell
npm start
```

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

* Remove the `preinstall: ...` line from `package.json`
* Install the SDK: `npm install @viamrobotics/sdk@latest`
* You will also need to rename the components in the example code to match the actual component names in your configuration, for example, the camera could be named "cam" here but "camera" in your configuration. 
