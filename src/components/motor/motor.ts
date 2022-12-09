
export interface Motor {
  setPower(power: number, direction: string):Promise<Object>;

  goFor(rpm:number, direction:string, revolutions:number):Promise<Object>;

  goTo(rpm:number, position:number):Promise<Object>;

  motorStop() :Promise<Object>

  getProperties() :Promise<boolean>;

  getPosition():Promise<number>;
}
