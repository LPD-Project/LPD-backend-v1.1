import { Inject, OnModuleInit } from "@nestjs/common";
import { CATCH_WATERMARK } from "@nestjs/common/constants";
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";

import * as admin from 'firebase-admin';
import { Server, Socket } from 'socket.io'

type SdpMap = Record<string, string>;

@WebSocketGateway({ cors: true })
export class GateWayWebSocket implements OnModuleInit {
    constructor(@Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App) { }

    @WebSocketServer()
    server: Server
    private clientMap: Record<string, string[]> = {};

    private offerMap: SdpMap = {};

    private deviceMap: Record<string, string> = {};
    private raspiMap: Record<string, string> = {};
    private hartbeatMap: Record<string, number> = {};
    private userMap: Record<string, string> = {};

    onModuleInit() {
        // change to firestore logic after finding device owner 
        this.server.on('connection', (socket) => {
            console.log("connected" , socket.id);

            socket.on('connect_error', (error) => {
                console.log('Connection error:', error);
              });

            socket.on('disconnect', async () => {
                console.log('Client disconnected');
                const deviceDisconnectedId = getKeyByValue(this.deviceMap, socket.id)
                // const userDisconnectedId = getKeyByValue(this.userMap, socket.id)
                // const raspiDisconnecId = getKeyByValue(this.raspiMap, socket.id)

                if (deviceDisconnectedId) {

                    console.log("deviceDisconnectedId", deviceDisconnectedId);

                    this.hartbeatMap[deviceDisconnectedId] = null;

                    try {
                        const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                            .collection('Devices')
                            .where("deviceId", "==", deviceDisconnectedId)
                            .limit(1)
                            .get()
                        if (!deviceQuerySnapshot.empty) {
                            const deviceData = deviceQuerySnapshot.docs[0].ref
                            await deviceData.update({ 'status': 'disconnected' })
                        }
                    } catch (err) {
                        console.log("device status update , firebase error")
                    }

                } 
            
            });

        })

        setInterval(async () => {

            // this.server.to ( this.clientSocketId) . emit ( "OnLaserControl" , {"hello" : "laser control "})
            const now = Date.now();
            for (const deviceSerialCode in this.deviceMap) {
                if (deviceSerialCode != null) {
                    console.log("send to", this.deviceMap[deviceSerialCode])
                    this.server.to(
                        this.deviceMap[deviceSerialCode]
                    ).emit(
                        "checkAlive"
                    )

                    console.log("now time is ", now)
                    console.log("heartbeat Map is ", this.hartbeatMap)
                    console.log("device serial code is ", deviceSerialCode)

                    if ((now - this.hartbeatMap[deviceSerialCode]) > 3 * 60 * 1000) {
                        console.log("i kill a device")

                        this.deviceMap[deviceSerialCode] = null;
                        this.offerMap[deviceSerialCode] = null;
                        this.hartbeatMap[deviceSerialCode] = null;

                        try {
                            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                                .collection('Devices')
                                .where("deviceId", "==", deviceSerialCode)
                                .limit(1)
                                .get()
                            if (!deviceQuerySnapshot.empty) {
                                const deviceData = deviceQuerySnapshot.docs[0].ref
                                await deviceData.update({ 'status': 'disconnected' })
                            }
                        } catch (err) {
                            console.log("device status update , firebase error")
                        }
                    }
                }
            }
        }, 60 * 1000); // Check every minute
    }

    @SubscribeMessage('DeviceConnection')
    async onDeviceConnection(@MessageBody() Message: any  ,  @ConnectedSocket() socket: Socket ) {

        if (Message.device_serial_code) {
            this.deviceMap[Message.device_serial_code] = socket.id;
            console.log('device connect', Message.device_serial_code)
            console.log('device sid', this.deviceMap[Message.device_serial_code])
            console.log("user connect Map", this.userMap)
            try {
                const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                    .collection('Devices')
                    .where("deviceId", "==", Message.device_serial_code)
                    .limit(1)
                    .get()

                if (!deviceQuerySnapshot.empty) {
                    const deviceData = deviceQuerySnapshot.docs[0].ref
                    await deviceData.update({ 'status': 'preparing' })
                }
            } catch (err) {
                console.log("device status update , firebase error")
            }
            // add working status to Devices in Database 

        } else {
            console.log('wrong type<device> of peer connection');
        }

    }

    @SubscribeMessage('DeviceDisconnection')
    async onDeviceDisconnection(@MessageBody() Message: any) {
        if (Message.device_serial_code) {
            this.deviceMap[Message.device_serial_code] = null;
            this.offerMap[Message.device_serial_code] = null;

            try {

                const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                    .collection('Devices')
                    .where("deviceId", "==", Message.device_serial_code)
                    .limit(1)
                    .get()

                if (!deviceQuerySnapshot.empty) {
                    const deviceData = deviceQuerySnapshot.docs[0].ref
                    await deviceData.update({ 'status': 'disconnected' })
                }

            } catch (err) {
                console.log("device status update , firebase error")
            }

        } else {
            console.log('wrong type<device> of peer connection');
        }
    }



    @SubscribeMessage('DeviceHeartbeat')
    onDeviceHeartbeat(@MessageBody() Message: any) {
        try {
            if (Message.device_serial_code) {
                this.hartbeatMap[Message.device_serial_code] = Date.now();
                console.log("hartbeat :", Message.device_serial_code)

            } else {
                console.log('wrong type<device> of connection');
            }
        }
        catch (err) {
            console.log("server error")
        }
    }

    @SubscribeMessage('deviceReadyState')
    async onDeviceReadyState(@MessageBody() Message: any) {
        console.log("message ready state" , Message)
        try {

            if (Message.device_serial_code) {
                this.hartbeatMap[Message.device_serial_code] = Date.now();
                console.log("hartbeat :", Message.device_serial_code)
                try {
                    const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                        .collection('Devices')
                        .where("deviceId", "==", Message.device_serial_code)
                        .limit(1)
                        .get()

                    if (!deviceQuerySnapshot.empty) {
                        const deviceData = deviceQuerySnapshot.docs[0].ref
                        await deviceData.update({ 'status': 'connected' })
                    }

                } catch (err) {
                    console.log("device status update , firebase error")
                }
            } else {
                console.log('wrong type<device> of connection');
            }
        }
        catch (err) {
            console.log("server error")
        }
    }

    @SubscribeMessage('OfferSdpMessage')
    onOfferSdpMessage(@MessageBody() Message: any) {

        if (Message.type == "offer") {
            if (Message.device_serial_code) {
                this.offerMap[Message.device_serial_code] = Message.sdp;

                console.log(Message.type)
                console.log(Message.device_serial_code)
                console.log(Message.sdp)

                console.log("sdpOffer log : ", this.offerMap)

            } else {
                console.log('OfferSdpMessage error no device_serial_code');
            }
        } else {
            console.log('OfferSdpMessage error : sdp type');
        }
    }

    @SubscribeMessage('UserConnection')
    async onUserConnection(@MessageBody() Message: any  , @ConnectedSocket() socket: Socket ) {
        if (Message.user_id) {

            this.userMap[Message.user_id] = socket.id;

            // when user connect update 
            // user user device list 
            try {
                console.log("user_id", Message.user_id)
                console.log("use connect Map yy", this.userMap[Message.user_id])


                const userQuerySnapshot = await this.firebaseAdmin.firestore()
                    .collection('Users')
                    .where("uid", "==", Message.user_id)
                    .limit(1)
                    .get()

                if (!userQuerySnapshot.empty) {
                    const deviceData = userQuerySnapshot.docs[0].data()
                    console.log("deviceData", deviceData)
                    console.log("deviceData type ", typeof (deviceData))
                    this.clientMap[Message.user_id] = deviceData['deviceList']
                } else {
                    console.log("no user found")
                }

            } catch (err) {
                console.log("user get device , firebase error")
            }


            // list of device id
            const deviceOwn = this.clientMap[Message.user_id]
            console.log()
            for (var i = 0; i < deviceOwn.length; i++) {
                // check if device is connected
                if (this.deviceMap[deviceOwn[i]]) {
                    if (this.offerMap[deviceOwn[i]]) {
                        console.log(deviceOwn[i], "is sended to user", this.offerMap[deviceOwn[i]])
                        this.server
                            .to(this.userMap[Message.user_id])
                            .emit("onSdpOfferMessage", { sdp: this.offerMap[deviceOwn[i]] });

                    } else {
                        console.log("no sdp offer")
                    }

                } else {
                    console.log(deviceOwn[i], "device is not connected")
                }

            }

        } else {
            console.log('wrong type<user> of peer connection');
        }
    }

    @SubscribeMessage('UserDisconnection')
    async onUserDisconnection(@MessageBody() Message: any) {
        if (Message.user_id) {

            this.userMap[Message.user_id] = null;
            this.clientMap[Message.user_id] = null;

            try {
                const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                    .collection('Devices')
                    .where("deviceId", "==", Message.device_serial_code)
                    .limit(1)
                    .get()

                if (!deviceQuerySnapshot.empty) {
                    const deviceData = deviceQuerySnapshot.docs[0].ref
                    await deviceData.update({ 'status': 'preparing' })
                }
            } catch (err) {
                console.log("device status update , firebase error")
            }


        } else {
            console.log('wrong type<user> of peer connection');
        }
    }

    @SubscribeMessage('AnswerSdpMessage')
    onAnswerSdpMessage(@MessageBody() Message: any) {
        console.log("i am working on aswering")
        if (Message.type == "answer") {

            if (Message.device_serial_code) {
                if (this.deviceMap[Message.device_serial_code]) {

                    console.log("send to device :", this.deviceMap[Message.device_serial_code])
                    this.server
                        .to(this.deviceMap[Message.device_serial_code])
                        .emit("onSdpAnswerMessage", { "sdp": Message.sdp });
                }

            } else {
                console.log('AnswerSdpMessage error no device_serial_code');
            }
        } else {
            console.log('AnswerSdpMessage error : sdp type')
        }
    }

    @SubscribeMessage('IceCandidateMessage')
    onIceCandidate(@MessageBody() Message: any ,  @ConnectedSocket() socket: Socket  ) {
        console.log(Message);
        const keyUser: string | undefined = getKeyByValue(this.userMap, socket.id);
        const keyDevice: string | undefined = getKeyByValue(this.deviceMap, socket.id);
        var foundKey
        if (keyUser) {
            foundKey = keyUser
            // find user device
            // got device_serial_code 
            // device id (s) 
            var deviceOwn = this.clientMap[foundKey]

            if (deviceOwn.length > 0) {
                for (var i = 0; i < deviceOwn.length; i++) {
                    // check if device is connected

                    if (this.deviceMap[deviceOwn[i]]) {
                        this.server
                            .to(this.deviceMap[deviceOwn[i]])
                            .emit("onIceCandidateMessage", Message)
                        console.log("user send ice ", Message)
                    } else {
                        console.log("device is not connected")
                    }
                }

            } else {
                console.log("not found user's device")
            }
        } else if (keyDevice) {
            foundKey = keyDevice
            var findUser = getKeyByValue(this.clientMap, foundKey)
            if (findUser) {
                this.server
                    .to(this.userMap[findUser])
                    .emit("onIceCandidateMessage", Message)
            } else {
                console.log("user not found")
            }
        } else {
            console.log('Ice Error')
        }
    }

    @SubscribeMessage('LaserControl')
    async onLaserControl(@MessageBody() Message: any) {
        console.log( 'message' , Message)
        try {
            if (Message.device_serial_code) {

                const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                    .collection('Devices')
                    .where("deviceId", "==", Message.device_serial_code)
                    .limit(1)
                    .get()

                if (!deviceQuerySnapshot.empty) {
                    const deviceData = deviceQuerySnapshot.docs[0].ref

                    if (Message.laser == "true" || Message.laser == "false") {
                        await deviceData.update({ 'laserState': Message.laser })
                    } else {
                        await deviceData.update({ 'laserState': "true" })
                    }
                }

                console.log( "emitting OnLaserControl to rpi" , Message.device_serial_code , this.raspiMap[  Message.device_serial_code  ] ,  Message.laser )
                // raspi make write state file 
                this.server.to(  this.raspiMap[  Message.device_serial_code  ]).emit("OnLaserControl",  { "laser": Message.laser})

            } else {
                console.log('wrong type<device> of connection');
            }
        }
        catch (err) {
            console.log("server error")
        }
    }

    @SubscribeMessage('CameraControl')
    async onCameraControl(@MessageBody() Message: any) {
        console.log( 'message' , Message)

        try {

            if (Message.device_serial_code) {

                const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                    .collection('Devices')
                    .where("deviceId", "==", Message.device_serial_code)
                    .limit(1)
                    .get()

                if (!deviceQuerySnapshot.empty) {
                    const deviceData = deviceQuerySnapshot.docs[0].ref

                    if (Message.camera == "true" || Message.camera == "false") {
                        await deviceData.update({ 'cameraState': Message.camera })
                    } else {
                        await deviceData.update({ 'cameraState': "true" })
                    }
                }
                
                console.log( "emitting OnCameraControl to rpi" , Message.device_serial_code , this.raspiMap[  Message.device_serial_code  ] ,  Message.camera )


                // raspi make write state file 
                this.server.to(  this.raspiMap[  Message.device_serial_code  ]).emit("OnCameraControl",  { "camera": Message.camera})

            } else {
                console.log('wrong type<device> of connection');
            }
        }
        catch (err) {
            console.log("server error")
        }
    }

    @SubscribeMessage('RaspiConnection')
    async onRaspiConnectionn(@MessageBody() Message: any ,  @ConnectedSocket() socket: Socket  ) {
        if (Message.device_serial_code) {
            this.raspiMap[Message.device_serial_code] = socket.id;
            // add working status to Devices in Database 
        } else {
            console.log('wrong type<device> of peer connection , raspi');
        }
    }


}





function getKeyByValue<T>(map: Record<string, T>, targetValue: T): string | undefined {
    return Object.keys(map).find((key) => map[key] === targetValue);
}
