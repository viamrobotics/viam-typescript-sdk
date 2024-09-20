import { appApi, type AccessToken, type Credential } from '@viamrobotics/sdk';
import { useMotionControls } from '../motion';
import { useRobotClientStore, useStream } from '../state';
import { MotionArrows } from './motion-arrows';
import { VideoStream } from './video-stream';

export interface MachinePartControlProps {
  credentials: Credential | AccessToken;
  machinePart: appApi.RobotPart.AsObject;
}

export const MachinePartControl = ({ credentials, machinePart }: MachinePartControlProps): JSX.Element => {
  const { connectOrDisconnect, streamClient, baseClient } = useRobotClientStore();
  const stream = useStream(streamClient, 'cam');
  const [motionState, requestMotion] = useMotionControls(baseClient);

  return (<>
    <div>
      <button className='bg-[#1da1f2]' onClick={() => connectOrDisconnect(machinePart.fqdn, credentials)}>Control Machine</button>
    </div>
    <VideoStream stream={stream}>
      {baseClient ? (
        <MotionArrows
          motionState={motionState}
          requestMotion={requestMotion}
        />
      ) : null}
    </VideoStream>
  </>);
};
