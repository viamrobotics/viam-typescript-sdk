# Viam SDK Quickstart

This example demonstrates how to connect to a robot. The example uses Vite + vanilla TypeScript and HTML.

> NOTE: Firefox on macOS requires using a local hostname instead of localhost. See the Firefox section below.

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

Firefox has a limitation with WebRTC when accessing via `localhost` due to network interface enumeration restrictions. To work around this, use a local hostname that resolves to localhost:

1. Add a local hostname to your hosts file:

   **macOS/Linux:**
   ```bash
   sudo bash -c 'echo "127.0.0.1	dev.local" >> /etc/hosts'
   ```

   **Windows (run Command Prompt as Administrator):**
   ```cmd
   echo 127.0.0.1	dev.local >> C:\Windows\System32\drivers\etc\hosts
   ```

2. Start the dev server with the local hostname:
   ```bash
   npm run dev -- --host dev.local
   ```

3. Open Firefox and navigate to `http://dev.local:5173`

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

- Remove the `preinstall: ...` line from `package.json`
- Install the SDK: `npm install @viamrobotics/sdk@latest`
