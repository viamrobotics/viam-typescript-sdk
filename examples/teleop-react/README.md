# React Tele-operation Example

This example project allows you to stream a video from a Viam Rover and control its movements with your keyboard or mouse.

## Setup

First, follow the setup instructions for the repository in `CONTRIBUTING.md`. Then, install development dependencies for the demo and launch a dev server.

```shell
cd examples/teleop-react
npm install
```

The connection hostname and secret fields can be pre-filled from a `.env` file in the `teleop-react` directory. You have to set these before running npm start. 

```ini
# examples/teleop-react/.env
VITE_HOST="<HOST>"
VITE_API_KEY_ID="<API_KEY_ID>"
VITE_API_KEY="<API_KEY>"
```

```shell
npm start
```

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

* Remove the `preinstall: ...` line from `package.json`
* Install the SDK: `npm install @viamrobotics/sdk@latest`
* You will also need to rename the components in the example code to match the actual component names in your configuration, for example, the camera could be named "cam" here but "camera" in your configuration. 
