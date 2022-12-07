
export interface Motor {
  setPower(power: number,direction: string):any;
      
  goFor(rpm:number,direction:string,revolutions:number):any;
    
  goTo(rpm:number, position:number):any;
    
  motorStop() :any
  
  getProperties () :any;

  getPosition():any
}
