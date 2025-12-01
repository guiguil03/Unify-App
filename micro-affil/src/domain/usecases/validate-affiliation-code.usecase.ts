// Use Case : Valider et utiliser un code d'affiliation
// Règles métier : vérification d'existence, auto-affiliation interdite, etc.

import { Inject, Injectable } from '@nestjs/common';
import { IAffiliationRepository, AFFILIATION_REPOSITORY } from '../ports/affiliation.repository.interface';
import { CodeGeneratorService } from '../services/code-generator.service';
import { AffiliationUsage } from '../models/affiliation-usage.entity';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationResult {
  valid: boolean;
  affiliationId?: string;
  affiliatorUserId?: string;
  usage?: AffiliationUsage;
  error?: string;
}

@Injectable()
export class ValidateAffiliationCodeUseCase {
  constructor(
    @Inject(AFFILIATION_REPOSITORY)
    private readonly affiliationRepository: IAffiliationRepository,
    private readonly codeGenerator: CodeGeneratorService
  ) {}

  async execute(code: string, newUserId: string): Promise<ValidationResult> {
    // Règle 1 : Format du code valide
    if (!this.codeGenerator.isValid(code)) {
      return {
        valid: false,
        error: 'Format de code invalide',
      };
    }

    // Règle 2 : Le code doit exister
    const affiliation = await this.affiliationRepository.findByCode(code);
    if (!affiliation) {
      return {
        valid: false,
        error: 'Code d\'affiliation introuvable',
      };
    }

    // Règle 3 : Un utilisateur ne peut pas s'affilier avec son propre code
    if (affiliation.isOwnedBy(newUserId)) {
      return {
        valid: false,
        error: 'Vous ne pouvez pas utiliser votre propre code d\'affiliation',
      };
    }

    // Règle 4 : Vérifier que l'utilisateur n'a pas déjà utilisé ce code
    const existingUsages = await this.affiliationRepository.getUsagesByAffiliationId(
      affiliation.id
    );
    const alreadyUsed = existingUsages.some(
      (usage) => usage.usedByUserId === newUserId
    );

    if (alreadyUsed) {
      return {
        valid: false,
        error: 'Vous avez déjà utilisé ce code d\'affiliation',
      };
    }

    // Enregistrer l'utilisation
    const usage = await this.affiliationRepository.recordUsage(
      affiliation.id,
      newUserId
    );

    // Incrémenter le compteur
    await this.affiliationRepository.incrementUsageCount(affiliation.id);

    return {
      valid: true,
      affiliationId: affiliation.id,
      affiliatorUserId: affiliation.userId,
      usage,
    };
  }
}
