// Use Case : Créer un code d'affiliation pour un utilisateur
// Règles métier orchestrées ici

import { Inject, Injectable } from '@nestjs/common';
import { IAffiliationRepository, AFFILIATION_REPOSITORY } from '../ports/affiliation.repository.interface';
import { CodeGeneratorService } from '../services/code-generator.service';
import { Affiliation } from '../models/affiliation.entity';

export class CreateAffiliationCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateAffiliationCodeError';
  }
}

@Injectable()
export class CreateAffiliationCodeUseCase {
  constructor(
    @Inject(AFFILIATION_REPOSITORY)
    private readonly affiliationRepository: IAffiliationRepository,
    private readonly codeGenerator: CodeGeneratorService
  ) {}

  async execute(userId: string): Promise<Affiliation> {
    // Règle métier : Un utilisateur ne peut avoir qu'un seul code
    const existingCode = await this.affiliationRepository.findByUserId(userId);
    if (existingCode) {
      throw new CreateAffiliationCodeError(
        `L'utilisateur ${userId} possède déjà un code d'affiliation`
      );
    }

    // Générer un code unique
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.codeGenerator.generate();
      attempts++;

      if (attempts >= maxAttempts) {
        throw new CreateAffiliationCodeError(
          'Impossible de générer un code unique après plusieurs tentatives'
        );
      }
    } while (await this.affiliationRepository.existsByCode(code));

    // Créer le code d'affiliation
    const affiliation = await this.affiliationRepository.create(userId, code);

    return affiliation;
  }
}
