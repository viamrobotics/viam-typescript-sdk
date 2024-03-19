# Tele-operation Interface

This example demonstrates how to build remote control UI on a robot with motor
controls, accelerometer readings, and a wifi strength sensor.

This example is implemented using Elm with ports.

## Usage

1. Install dependencies (once): `npm install`

2. Start the development server: `npm start`

3. Visit `localhost:8000` in a browser. You should see an interface that looks like this after a few seconds:

![teledemo ui](doc/teledemo-ui.png?raw=true)

4. (Maybe) You may need to enable "allow audio and video" in your browser to get a live
video stream.

![select allow and video](doc/allow-audio-video.png?raw=true)

### Base Project Template

This example assumes that you are working inside the Viam TypeScript SDK repository. If you want to use this example as a base for your project, make the following changes:

* Remove the `preinstall: ...` line from `package.json`
* Install the SDK: `npm install @viamrobotics/sdk@latest`
