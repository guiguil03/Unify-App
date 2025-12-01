// Module principal de l'application

import { Module } from '@nestjs/common';
import { ApplicationModule } from './application/application.module';

@Module({
  imports: [ApplicationModule],
})
export class AppModule {}
