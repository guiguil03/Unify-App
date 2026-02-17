// src/services/ProfilePhotoService.ts
import { supabase } from '../config/supabase';

export class ProfilePhotoService {
  /**
   * Upload une photo de profil vers le bucket profile-photo
   */
  static async uploadProfilePhoto(imageUri: string): Promise<string> {
    try {
      // Récupérer l'utilisateur authentifié
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
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

      // Créer un nom de fichier unique avec le user ID
      // On utilise "profile" comme nom de fichier pour remplacer l'ancienne photo
      const storageFileName = `${authUser.id}/profile.${fileExt}`;

      // Upload vers Supabase Storage (bucket profile-photo)
      // Utiliser upsert: true pour remplacer l'ancienne photo si elle existe
      const { data, error } = await supabase.storage
        .from('profile-photo')
        .upload(storageFileName, fileData, {
          contentType: contentType,
          upsert: true, // Remplacer l'ancienne photo
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photo')
        .getPublicUrl(storageFileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de la photo de profil:', error);
      throw new Error(error.message || 'Impossible de télécharger la photo de profil');
    }
  }

  /**
   * Supprime la photo de profil actuelle
   */
  static async deleteProfilePhoto(): Promise<void> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Supprimer tous les fichiers de profil de l'utilisateur
      const { data: files } = await supabase.storage
        .from('profile-photo')
        .list(authUser.id);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${authUser.id}/${file.name}`);
        const { error } = await supabase.storage
          .from('profile-photo')
          .remove(filePaths);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la photo de profil:', error);
      throw new Error(error.message || 'Impossible de supprimer la photo de profil');
    }
  }
}


