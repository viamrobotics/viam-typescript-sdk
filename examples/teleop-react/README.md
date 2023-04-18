# React Tele-operation Example

This example project allows you to stream a video from a Viam Rover and control its movements with your keyboard or mouse.

## Setup

First, follow the setup instructions for the repository in `CONTRIBUTING.md`. Then, install development dependencies for the demo and launch a dev server.

```shell
cd examples/teleop-react
npm install
npm start
```

The connection hostname and secret fields can be pre-filled from a `.env` file in the `teleop-react` directory.

```ini
# examples/teleop-react/.env
VITE_ROBOT_HOSTNAME=my-cool-robot.viam.cloud
VITE_ROBOT_SECRET=super-secret-key
```
