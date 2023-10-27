import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { GatewayModule } from './gateway/gateway.module';



@Module({
  imports: [FirebaseModule, GatewayModule],
  controllers: [AppController ],
  providers: [AppService ],
})
export class AppModule {}
