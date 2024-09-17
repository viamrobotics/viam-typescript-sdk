import { appApi, type AppClient } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';

export interface MachinesPartsListProps {
  appClient: AppClient;
  machine: appApi.Robot.AsObject;
  onMachinePartSelected: (machine: appApi.RobotPart.AsObject) => unknown;
}

export const MachinePartsList = (props: MachinesPartsListProps): JSX.Element => {
  const { appClient, machine, onMachinePartSelected } = props;

  const [machineParts, setMachineParts] = useState<appApi.RobotPart.AsObject[]>([]);
  useEffect(() => {
    async function getMachineParts() {
      const machineParts = await appClient.getRobotParts(machine.id);
      setMachineParts(machineParts);
    }
    getMachineParts();
  }, [appClient]);

  return (
    <div>
      {machineParts?.map((part) => {
        return <div key={part.id}>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            onMachinePartSelected(part);
          }}>{part.name}</a>
        </div>
      })}
    </div >
  );
};
