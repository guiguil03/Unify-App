// Use Case : Récupérer le code d'affiliation d'un utilisateur

import { Inject, Injectable } from '@nestjs/common';
import { IAffiliationRepository, AFFILIATION_REPOSITORY } from '../ports/affiliation.repository.interface';
import { Affiliation } from '../models/affiliation.entity';

export class GetAffiliationCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetAffiliationCodeError';
  }
}

@Injectable()
export class GetAffiliationCodeUseCase {
  constructor(
    @Inject(AFFILIATION_REPOSITORY)
    private readonly affiliationRepository: IAffiliationRepository
  ) {}

  async execute(userId: string): Promise<Affiliation | null> {
    const affiliation = await this.affiliationRepository.findByUserId(userId);
    return affiliation;
  }
}
