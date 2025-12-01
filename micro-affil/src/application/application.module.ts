// Module Application : fournit les controllers et l'API

import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { AffiliationController } from './api/affiliation.controller';

@Module({
  imports: [DomainModule],
  controllers: [AffiliationController],
})
export class ApplicationModule {}
