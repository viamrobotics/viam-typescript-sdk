import { grpc } from '@improbable-eng/grpc-web';
import { MotorServiceClient } from '../../gen/component/motor/v1/motor_pb_service.esm'
import type { ServiceError } from "../../gen/robot/v1/robot_pb_service.esm";
import { motorApi } from '../../main';
import type { Motor } from './motor';


class MotorClient implements Motor {
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
        this.mc.setPower(req, new grpc.Metadata(), displayError)
      };
      
    async goFor(rpm:number,direction:string,revolutions:number){
        const req = new motorApi.GoForRequest();
        req.setName(this.name);
        req.setRpm(rpm * setDirection(direction));
        req.setRevolutions(revolutions);
      
        rcLogConditionally(req);
        this.mc.goFor(req, new grpc.Metadata(), displayError);
      };
      
    async goTo(rpm:number, position:number){
        const req = new motorApi.GoToRequest();
        req.setName(this.name);
        req.setRpm(rpm);
        req.setPositionRevolutions(position);
      
        rcLogConditionally(req);
        this.mc.goTo(req, new grpc.Metadata(), displayError);
      };
      
    async motorStop() {
        const req = new motorApi.StopRequest();
        req.setName(this.name);
      
        rcLogConditionally(req);
        this.mc.stop(req, new grpc.Metadata(), displayError);
      };
    
    async getProperties () {
        const req = new motorApi.GetPropertiesRequest();
        req.setName(this.name)
        rcLogConditionally(req)
        this.mc.getProperties(req, new grpc.Metadata(),callback)
    }

    async getPosition() {
        const req = new motorApi.GetPositionRequest();
        req.setName(this.name)
        this.mc.getPosition(req, new grpc.Metadata(), callback)
        callback.
    }
}

export const callback = (error: ServiceError | null, res: motorApi.GetPropertiesResponse| null ) => (){

}

// function meow(error: ServiceError | null, res: motorApi.GetPropertiesResponse| null ): (motorApi.GetPropertiesResponse| null ){
//     return  res
// }



export const displayError = (error: ServiceError | null) => {
    if (error) {
      console.error(error);
    }
  };

  export const rcLogConditionally = (req: unknown) => {
    if (window) {
      console.log('gRPC call:', req);
    }
  };


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
