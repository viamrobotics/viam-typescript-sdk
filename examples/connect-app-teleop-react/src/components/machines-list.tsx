import { appApi, type AppClient } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';

export interface MachinesListProps {
  appClient: AppClient;
  location: appApi.Location.AsObject;
  onMachineSelected: (machine: appApi.Robot.AsObject) => unknown;
}

export const MachinesList = ({ appClient, location, onMachineSelected }: MachinesListProps): JSX.Element => {
  const [machines, setMachines] = useState<appApi.Robot.AsObject[]>([]);
  useEffect(() => {
    async function getMachines() {
      const machines = await appClient.listRobots(location.id);
      setMachines(machines);
    }
    getMachines();
  }, [appClient]);

  return (
    <div>
      {
        machines?.map((machine) => {
          return <div key={machine.id}>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              onMachineSelected(machine);
            }}>{machine.name}</a>
          </div>
        })
      }
    </div >
  );
};
