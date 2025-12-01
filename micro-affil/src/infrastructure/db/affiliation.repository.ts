// Implémentation concrète du repository avec Supabase
// Adapte Supabase aux interfaces du domaine

import { Injectable } from '@nestjs/common';
import { IAffiliationRepository } from '../../domain/ports/affiliation.repository.interface';
import { Affiliation } from '../../domain/models/affiliation.entity';
import { AffiliationUsage } from '../../domain/models/affiliation-usage.entity';
import { SupabaseService } from './supabase.client';

// Types pour la base de données
interface AffiliationRow {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  used_count: number;
}

interface AffiliationUsageRow {
  id: string;
  affiliation_id: string;
  used_by_user_id: string;
  used_at: string;
}

@Injectable()
export class SupabaseAffiliationRepository implements IAffiliationRepository {
  private readonly tableName = 'affiliations';
  private readonly usageTableName = 'affiliation_usages';

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, code: string): Promise<Affiliation> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .insert({
        user_id: userId,
        code: code,
        used_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'affiliation: ${error.message}`);
    }

    return this.mapToEntity(data as AffiliationRow);
  }

  async findByCode(code: string): Promise<Affiliation | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Erreur lors de la recherche par code: ${error.message}`);
    }

    return this.mapToEntity(data as AffiliationRow);
  }

  async findByUserId(userId: string): Promise<Affiliation | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Erreur lors de la recherche par userId: ${error.message}`);
    }

    return this.mapToEntity(data as AffiliationRow);
  }

  async existsByCode(code: string): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .select('id')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur lors de la vérification du code: ${error.message}`);
    }

    return data !== null;
  }

  async recordUsage(affiliationId: string, usedByUserId: string): Promise<AffiliationUsage> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.usageTableName)
      .insert({
        affiliation_id: affiliationId,
        used_by_user_id: usedByUserId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'enregistrement de l'utilisation: ${error.message}`);
    }

    return this.mapToUsageEntity(data as AffiliationUsageRow);
  }

  async getUsagesByAffiliationId(affiliationId: string): Promise<AffiliationUsage[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.usageTableName)
      .select('*')
      .eq('affiliation_id', affiliationId);

    if (error) {
      throw new Error(`Erreur lors de la récupération des utilisations: ${error.message}`);
    }

    return (data as AffiliationUsageRow[]).map(this.mapToUsageEntity);
  }

  async incrementUsageCount(affiliationId: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .rpc('increment_affiliation_usage', { affiliation_id: affiliationId });

    if (error) {
      throw new Error(`Erreur lors de l'incrémentation du compteur: ${error.message}`);
    }
  }

  // Mappers : transforme les données DB en entités du domaine
  private mapToEntity(row: AffiliationRow): Affiliation {
    return new Affiliation(
      row.id,
      row.user_id,
      row.code,
      new Date(row.created_at),
      row.used_count
    );
  }

  private mapToUsageEntity(row: AffiliationUsageRow): AffiliationUsage {
    return new AffiliationUsage(
      row.id,
      row.affiliation_id,
      row.used_by_user_id,
      new Date(row.used_at)
    );
  }
}
