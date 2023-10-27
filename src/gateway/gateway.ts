import { Inject, OnModuleInit } from "@nestjs/common";
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import * as admin from 'firebase-admin';
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: true })
export class GateWayWebSocket implements OnModuleInit {
    constructor(@Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App) { }
    @WebSocketServer()
    server: Server

    onModuleInit() {
        this.server.on('connection', (socket) => {
            console.log(socket.id);
            console.log("connected");
        })
    }

    @SubscribeMessage('newMessage')
    onNewMessage(@MessageBody() body: any) {
        console.log('Received newMessage:', body);
        this.server.emit('onMessage', {
            body: body,
            msg: "hello 100%"
        })
    }

    @SubscribeMessage('sdpOffer')
    onSdpOffer(@MessageBody() sdpOffer: any) {
        
        console.log('SDP is :', sdpOffer.sdp);
        console.log('Type is :', sdpOffer.type);

        // Assuming you have a Firebase Firestore database
        const roomRef = this.firebaseAdmin.firestore().collection("rooms");
        const callerRef = roomRef.doc().collection("caller").doc();
    
        callerRef.set({
            deviceName : "deviceID-2", 
            sdp : sdpOffer
        })

        this.server.emit('onMessage', {
            body: sdpOffer,
            msg: 'Received SDP offer and stored in Firebase',
        });
    }
}