import {MotorClient} from './client'
import { grpc } from '@improbable-eng/grpc-web';
import type { Motor } from './motor'



class MotorService implements Motor{

    async setPower(power: number,direction: string){
        let meow  = grpc.client()
        grpc.invoke()
    }
      
    goFor(rpm:number,direction:string,revolutions:number):any;
    
    goTo(rpm:number, position:number):any;
    
    motorStop() :any
    
    getProperties () :any;

    getPosition():any
    }