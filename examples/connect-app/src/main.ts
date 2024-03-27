// This code must be run in a browser environment.
import * as VIAM from '@viamrobotics/sdk';

const main = async () => {


  console.log("here????")
  const host = 'penta-main.4hk6rzx88z.viam.cloud';

  const machine = await VIAM.createRobotClient({
    host,
    credential: {
      type: 'api-key' ,
      payload: 'fuz2myr6r1528mb6ayf5i3di17g6pevs',
    } ,
    authEntity: '3074554d-dd14-4e53-98b4-510a1ca58fe5',
    signalingAddress: 'https://app.viam.com:443',
  });

  // Note that the pin supplied is a placeholder. Please change this to a valid pin you are using.
    // local
    const localClient = new VIAM.BoardClient(machine, 'local');
    const localReturnValue = await localClient.getGPIO('16');
    console.log('local getGPIO return value:', localReturnValue);

    // sensor-1
    const sensor1Client = new VIAM.SensorClient(machine, 'sensor-1');
    const sensor1ReturnValue = await sensor1Client.getReadings();
    console.log('sensor-1 getReadings return value:', sensor1ReturnValue);

  console.log('Resources:');
  console.log(await machine.resourceNames());
};

main().catch((error) => {
  alert('Does this work?');
  console.log('here?')
  console.error('encountered an error:', error);
});
