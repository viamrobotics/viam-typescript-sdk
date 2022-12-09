import { MotorServiceClient } from '../../gen/component/motor/v1/motor_pb_service.esm'
import { motorApi } from '../../main';
import type { Motor } from './motor';
import { Promisify, rcLogConditionally } from '../ComponentUtils';

export class MotorClient implements Motor {
    private mc: MotorServiceClient
    private name: string;

    constructor(serviceHost: string, name:string){
        this.mc = new MotorServiceClient(serviceHost);
        this.name = name;
    }

    async setPower (power: number,direction: string){
        const powerPct = power * setDirection(direction) / 100;
        const req = new motorApi.SetPowerRequest();
        req.setName(this.name);
        req.setPowerPct(powerPct);
        rcLogConditionally(req);

        let resultProm = await Promisify
        <motorApi.SetPowerRequest,motorApi.SetPowerResponse>
        (this.mc.setPower,req)

        return resultProm.toObject()
      };
      
    async goFor(rpm:number,direction:string,revolutions:number){
        
        const req = new motorApi.GoForRequest();
        req.setName(this.name);
        req.setRpm(rpm * setDirection(direction));
        req.setRevolutions(revolutions);
        rcLogConditionally(req);

        let resultProm = await Promisify
        <motorApi.GoForRequest,motorApi.GoForResponse>
        (this.mc.goFor, req);

        return resultProm.toObject()
      };
      
    async goTo(rpm:number, position:number){
        
        const req = new motorApi.GoToRequest();
        req.setName(this.name);
        req.setRpm(rpm);
        req.setPositionRevolutions(position);
        rcLogConditionally(req);

        let resultProm = await Promisify
        <motorApi.GoToRequest,motorApi.GoToResponse>
        (this.mc.goTo,req)

        return resultProm.toObject()
      };
      
    async motorStop() {

        const req = new motorApi.StopRequest();
        req.setName(this.name);
        rcLogConditionally(req);

        let resultProm = await Promisify
        <motorApi.StopRequest,motorApi.StopResponse>
        (this.mc.stop, req)

        return resultProm.toObject()
      };
    
    async getProperties () {
        const req = new motorApi.GetPropertiesRequest();
        req.setName(this.name)

        let resultProm = await Promisify
        <motorApi.GetPropertiesRequest,motorApi.GetPropertiesResponse>
        (this.mc.getProperties,req)

        return resultProm.getPositionReporting()
    }

    async getPosition() {
        const req = new motorApi.GetPositionRequest();
        req.setName(this.name)

        rcLogConditionally(req)
        let resultProm = await Promisify
        <motorApi.GetPositionRequest,motorApi.GetPositionResponse>
        (this.mc.getPosition,req)
        
        return resultProm.getPosition()
    }
}

function setDirection(value: string):number {
    switch (value) {
      case 'Forwards': {
        return  1;
      }
      case 'Backwards': {
        return  -1;
        
      }
      default: {
        return  1;
      }
    }
  };
