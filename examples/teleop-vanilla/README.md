# teleop-vanilla

In order to use this, you must have a `.env` file in this directory with the following connection info which can be easily found in the TypeScript code sample for your machine.

```
VITE_HOST="<HOST>"
VITE_API_KEY_ID="<API_KEY_ID>"
VITE_API_KEY="<API_KEY>"
```

Make sure to build the TypeScript SDK, then run the example using Vite.

```
make build lint
cd examples/teleop-vanilla
npm install
npm run dev
```
