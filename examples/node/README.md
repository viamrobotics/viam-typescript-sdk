# Viam SDK Quickstart - Node

This example demonstrates how to connect to a machine using Node.js.

## Usage

You must have a `.env` file in this directory with the following connection info which can be easily found in the TypeScript code sample for your machine.

```
HOST="<HOST>"
API_KEY_ID="<API_KEY_ID>"
API_KEY="<API_KEY>"
```

Installing will build the TypeScript SDK, then you can run the example using Vite.

```
cd examples/node
npm install
npm start
```

Edit `src/main.ts` to change the machine logic being run.

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

* Remove the `preinstall: ...` line from `package.json`
* Install the SDK: `npm install @viamrobotics/sdk@latest`
