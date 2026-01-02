import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { IdentityVerification, CreateIdentityVerificationData, IdentityVerificationStatus } from '../types/identityVerification';

export class IdentityVerificationService {
  /**
   * Récupère la vérification d'identité de l'utilisateur actuel
   */
  static async getVerification(): Promise<IdentityVerification | null> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucune vérification trouvée
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        idDocumentFrontUrl: data.id_document_front_url,
        idDocumentBackUrl: data.id_document_back_url,
        selfieUrl: data.selfie_url,
        status: data.status as IdentityVerificationStatus,
        submittedAt: data.submitted_at,
        verifiedAt: data.verified_at,
        rejectionReason: data.rejection_reason,
      };
    } catch (error) {
      console.error('Erreur dans getVerification:', error);
      return null;
    }
  }

  /**
   * Upload une image vers Supabase Storage (bucket privé)
   */
  static async uploadIdentityDocument(imageUri: string, fileName: string): Promise<string> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Lire le fichier comme ArrayBuffer
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Déterminer le type MIME
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';

      // Créer un nom de fichier unique avec le userId
      const storageFileName = `${currentUser.id}/${fileName}_${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage (bucket privé)
      const { data, error } = await supabase.storage
        .from('identity-verifications')
        .upload(storageFileName, fileData, {
          contentType: contentType,
          upsert: false,
        });

      if (error) throw error;

      // Retourner le chemin du fichier pour stockage en base
      return storageFileName;
    } catch (error: any) {
      console.error('Erreur lors de l\'upload du document:', error);
      throw new Error(error.message || 'Impossible de télécharger le document');
    }
  }

  /**
   * Crée ou met à jour une vérification d'identité
   */
  static async submitVerification(data: CreateIdentityVerificationData): Promise<IdentityVerification> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier si une vérification existe déjà
      const existing = await this.getVerification();

      const verificationData: any = {
        user_id: currentUser.id,
        id_document_front_url: data.idDocumentFrontUrl || null,
        id_document_back_url: data.idDocumentBackUrl || null,
        selfie_url: data.selfieUrl || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      };

      let result;
      if (existing) {
        // Mise à jour
        const { data: updated, error } = await supabase
          .from('identity_verifications')
          .update(verificationData)
          .eq('user_id', currentUser.id)
          .select()
          .single();

        if (error) throw error;
        result = updated;
      } else {
        // Création
        const { data: created, error } = await supabase
          .from('identity_verifications')
          .insert(verificationData)
          .select()
          .single();

        if (error) throw error;
        result = created;
      }

      return {
        id: result.id,
        userId: result.user_id,
        idDocumentFrontUrl: result.id_document_front_url,
        idDocumentBackUrl: result.id_document_back_url,
        selfieUrl: result.selfie_url,
        status: result.status as IdentityVerificationStatus,
        submittedAt: result.submitted_at,
        verifiedAt: result.verified_at,
        rejectionReason: result.rejection_reason,
      };
    } catch (error: any) {
      console.error('Erreur dans submitVerification:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL signée d'un document d'identité
   */
  static async getSignedUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('identity-verifications')
        .createSignedUrl(filePath, 3600); // 1 heure

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL signée:', error);
      return null;
    }
  }
}

