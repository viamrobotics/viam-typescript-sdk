import { appApi, type AppClient } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';

export interface MachinesPartsListProps {
  appClient: AppClient;
  machine: appApi.Robot;
  onMachinePartSelected: (machine: appApi.RobotPart) => unknown;
}

export const MachinePartsList = ({ appClient, machine, onMachinePartSelected }: MachinesPartsListProps): JSX.Element => {
  const [machineParts, setMachineParts] = useState<appApi.RobotPart[]>([]);
  useEffect(() => {
    async function getMachineParts() {
      const machineParts = await appClient.getRobotParts(machine.id);
      setMachineParts(machineParts);
    }
    getMachineParts();
  }, [appClient, machine.id]);

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
