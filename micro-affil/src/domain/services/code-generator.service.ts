// Service du domaine : Génération de codes d'affiliation
// Logique métier pure pour générer des codes uniques

import { customAlphabet } from 'nanoid';

export class CodeGeneratorService {
  private readonly nanoid: () => string;

  constructor() {
    // Alphabet personnalisé : sans caractères ambigus (0, O, I, l)
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    this.nanoid = customAlphabet(alphabet, 8);
  }

  generate(): string {
    return this.nanoid();
  }

  // Validation du format du code
  isValid(code: string): boolean {
    const regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/;
    return regex.test(code);
  }
}
