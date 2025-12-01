// Module Infrastructure : fournit les implémentations concrètes

import { Module } from '@nestjs/common';
import { SupabaseService } from './db/supabase.client';
import { SupabaseAffiliationRepository } from './db/affiliation.repository';
import { AFFILIATION_REPOSITORY } from '../domain/ports/affiliation.repository.interface';

@Module({
  providers: [
    SupabaseService,
    {
      provide: AFFILIATION_REPOSITORY,
      useClass: SupabaseAffiliationRepository,
    },
  ],
  exports: [AFFILIATION_REPOSITORY],
})
export class InfrastructureModule {}
