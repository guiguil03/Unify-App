// Module Domain : fournit les use cases et services métier

import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CreateAffiliationCodeUseCase } from './usecases/create-affiliation-code.usecase';
import { ValidateAffiliationCodeUseCase } from './usecases/validate-affiliation-code.usecase';
import { GetAffiliationCodeUseCase } from './usecases/get-affiliation-code.usecase';
import { CodeGeneratorService } from './services/code-generator.service';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CodeGeneratorService,
    CreateAffiliationCodeUseCase,
    ValidateAffiliationCodeUseCase,
    GetAffiliationCodeUseCase,
  ],
  exports: [
    CreateAffiliationCodeUseCase,
    ValidateAffiliationCodeUseCase,
    GetAffiliationCodeUseCase,
  ],
})
export class DomainModule {}
