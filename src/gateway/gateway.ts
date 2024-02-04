import { Inject, OnModuleInit } from "@nestjs/common";
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import * as admin from 'firebase-admin';
import { Server, Socket } from 'socket.io'
import { measureMemory } from "vm";

type SdpMap = Record<string, string>;

@WebSocketGateway({ cors: true })
export class GateWayWebSocket implements OnModuleInit {
    constructor(@Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App) { }

    @WebSocketServer()
    server: Server

    clientSocketId: string

    private clientMap: Record<string, string> = {};

    private offerMap: SdpMap = {};
    private answerMap: SdpMap = {};

    private deviceMap: Record<string, string> = {};
    private userMap: Record<string, string> = {};

    onModuleInit() {
        // change to firestore logic after finding device owner 
        this.clientMap['user1'] = 'device1';

        this.server.on('connection', (socket) => {
            console.log(socket.id);
            console.log("connected");
            this.clientSocketId = socket.id
        })
    }

    @SubscribeMessage('DeviceConnection')
    onDeviceConnection(@MessageBody() Message: any) {
        if (Message.device_serial_code) {
            this.deviceMap[Message.device_serial_code] = this.clientSocketId;
        } else {
            console.log('wrong type<device> of peer connection');
        }
    }

    @SubscribeMessage('OfferSdpMessage')
    onOfferSdpMessage(@MessageBody() Message: any) {
        console.log(Message)
        

        if (Message.type == "offer") {
            if (Message.device_serial_code) {
                this.offerMap[Message.device_serial_code] = Message.sdp;

                console.log(Message.type)
                console.log(Message.device_serial_code)
                console.log(Message.sdp)


            } else {
                console.log('OfferSdpMessage error no device_serial_code');
            }
        } else {
            console.log('OfferSdpMessage error : sdp type');
        }
    }

    @SubscribeMessage('UserConnection')
    onUserConnection(@MessageBody() Message: any) {
        if (Message.user_id) {
            this.userMap[Message.user_id] = this.clientSocketId;

            if (this.clientMap[Message.user_id]) {
                this.server
                    .to(this.userMap[Message.user_id])
                    .emit("onSdpOfferMessage", { sdp: this.offerMap[this.clientMap[Message.user_id]] });
            } else {
                console.log(`${Message.device_serial_code} not found in the Map.`);
            }
        } else {
            console.log('wrong type<user> of peer connection');
        }
    }

    @SubscribeMessage('AnswerSdpMessage')
    onAnswerSdpMessage(@MessageBody() Message: any) {
        if (Message.type == "answer") {
            if (Message.user_id) {
                this.answerMap[Message.user_id] = Message.sdp;
                this.server
                    .to(this.deviceMap[this.clientMap[Message.user_id]])
                    .emit("onSdpAnswerMessage", { "sdp": this.answerMap[Message.user_id] });
            } else {
                console.log('AnswerSdpMessage error no device_serial_code');
            }
        } else {
            console.log('AnswerSdpMessage error : sdp type')
        }
    }

    @SubscribeMessage('IceCandidateMessage')
    onIceCandidate(@MessageBody() Message: any) {
        console.log(Message) ;
        const keyUser: string | undefined = getKeyByValue(this.userMap, this.clientSocketId);
        const keyDevice: string | undefined = getKeyByValue(this.deviceMap, this.clientSocketId);
        var foundKey 
        if(keyUser){
            foundKey = keyUser
            // find user device
            // got device_serial_code 
            if( this.clientMap[foundKey]) {
                this.server
                .to(this.deviceMap[this.clientMap[foundKey]]) 
                .emit("onIceCandidateMessage" , Message )
            }else {
                console.log("not found user's device")
            }
        } else if(keyDevice){
            foundKey = keyDevice
            var findUser = getKeyByValue(this.clientMap , foundKey)
            if(findUser){
                this.server
                .to(this.userMap[findUser]) 
                .emit("onIceCandidateMessage" , Message )
            }else{
                console.log("user not found")
            }
        }else{
            console.log('Ice Error')
        }
    }
}

function getKeyByValue<T>(map: Record<string, T>, targetValue: T): string | undefined {
    return Object.keys(map).find((key) => map[key] === targetValue);
}

