export class User {

    //not null 
    email! : string ;
    uid! : string ;


    //null able 
    username? : string ;
    imageUrl? : string ;
    deviceList? : Array<string>;
    
    constructor(email:string ,uid:string ,username? :string, imageUrl? :string ,deviceList?:Array<string>) {
        this.email = email;
        this.uid = uid;
        this.username = username;
        this.imageUrl = imageUrl;
        this.deviceList = deviceList;
      }

}