// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';

import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
  
  // Enable CORS for all routes
  app.use(cors());

  // Use 0.0.0.0 for all available network interfaces
  await app.listen(3000,'0.0.0.0');

}

bootstrap();

