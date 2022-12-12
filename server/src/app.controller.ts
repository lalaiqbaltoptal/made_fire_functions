import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import admin from 'firebase-admin';
import { ServiceAccountKey } from './config/firebase-cred';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    this.initialize();
  }

  initialize() {
    const serviceKey = new ServiceAccountKey();

    admin.initializeApp({
      credential: admin.credential.cert(serviceKey.toJson),
    });
  }
}
