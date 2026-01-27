# Viam SDK Quickstart

This example demonstrates how to connect to a robot. The example uses Vite + vanilla TypeScript and HTML.

> NOTE: Firefox on macOS requires accessing the dev server via your local network IP instead of localhost. See the Firefox section below.

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

### Firefox

Firefox has a limitation with WebRTC when accessing via `localhost`. To use this example in Firefox:

1. Start the dev server on all network interfaces:
   ```
   npm run dev -- --host 0.0.0.0
   ```

2. Find your local IP address:
   ```
   MacOS Example:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. Open Firefox and navigate to `http://<YOUR_LOCAL_IP>:5173` (e.g., `http://192.168.1.100:5173`)

**Security Note:** When running with `--host 0.0.0.0`, your dev server is accessible from other machines on your local network. Only use this on trusted networks (like your home WiFi).

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

- Remove the `preinstall: ...` line from `package.json`
- Install the SDK: `npm install @viamrobotics/sdk@latest`
