export class Device {

    //not null 
    device_serial_code! : string ;
    device_name? : string ;
    imageUrl? : string ;

    constructor(device_serial_code:string ,device_name:string ,imageUrl? :string ) {
        this.device_serial_code = device_serial_code;
        this.device_name = device_name;
        this.imageUrl = imageUrl;
  
      }

}