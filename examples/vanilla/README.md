# Viam SDK Quickstart

This example demonstrates how to connect to a robot. The example uses Vite + vanilla TypeScript and HTML.

> NOTE: This example does not work in Firefox. Please use Safari/Chrome/Chromium-based browser

## Usage

You must have a `.env` file in this directory with the following connection info which can be easily found in the TypeScript code sample for your machine.

```
VITE_HOST="<HOST>"
VITE_API_KEY_ID="<API_KEY_ID>"
VITE_API_KEY="<API_KEY>"
```

Installing will build the TypeScript SDK, then you can run the example using Vite.

```
cd examples/vanilla
npm install
npm run dev
```

Edit `src/main.ts` to change the robot logic being run. Edit `index.html` to change the layout of the app.

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

- Remove the `preinstall: ...` line from `package.json`
- Install the SDK: `npm install @viamrobotics/sdk@latest`
