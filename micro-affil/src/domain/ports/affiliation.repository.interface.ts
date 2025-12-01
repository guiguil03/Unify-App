// Port : Interface du repository (contrat abstrait)
// Cette interface définit les opérations nécessaires sans détails d'implémentation

import { Affiliation } from '../models/affiliation.entity';
import { AffiliationUsage } from '../models/affiliation-usage.entity';

export interface IAffiliationRepository {
  // Créer un nouveau code d'affiliation
  create(userId: string, code: string): Promise<Affiliation>;

  // Trouver par code
  findByCode(code: string): Promise<Affiliation | null>;

  // Trouver par userId
  findByUserId(userId: string): Promise<Affiliation | null>;

  // Vérifier si un code existe
  existsByCode(code: string): Promise<boolean>;

  // Enregistrer une utilisation
  recordUsage(affiliationId: string, usedByUserId: string): Promise<AffiliationUsage>;

  // Récupérer toutes les utilisations d'un code
  getUsagesByAffiliationId(affiliationId: string): Promise<AffiliationUsage[]>;

  // Incrémenter le compteur d'utilisation
  incrementUsageCount(affiliationId: string): Promise<void>;
}

export const AFFILIATION_REPOSITORY = Symbol('IAffiliationRepository');
