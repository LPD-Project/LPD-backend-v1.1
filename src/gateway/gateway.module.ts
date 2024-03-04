import { Module } from '@nestjs/common';
import { GateWayWebSocket } from './gateway';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
    imports: [FirebaseModule],
    providers: [GateWayWebSocket]
})
export class GatewayModule {
}
