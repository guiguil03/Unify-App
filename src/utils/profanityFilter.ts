/**
 * Filtre de pseudos injurieux / inappropriés
 * Vérifie contre une liste de mots interdits (FR + EN)
 * Normalise les tentatives de contournement (accents, leetspeak, espaces)
 */

const BLOCKED_WORDS = [
  // Insultes FR
  'connard', 'connasse', 'salaud', 'salope', 'putain', 'pute',
  'enculé', 'encule', 'nique', 'niquer', 'ntm', 'ntm',
  'fdp', 'fils de pute', 'pd', 'pédé', 'pede', 'tapette',
  'batard', 'bâtard', 'merde', 'branleur', 'branleuse',
  'bouffon', 'bouffonne', 'casse couille', 'couille',
  'bite', 'bites', 'couilles', 'chatte', 'teub', 'tg', 'vtf',
  'trouduc', 'trou du cul', 'gueule', 'ta gueule',
  'enfoiré', 'enfoire', 'abruti', 'abrutie', 'débile',
  'gogol', 'mongol', 'attardé', 'attarde', 'crétin', 'cretin',

  // Racisme / discrimination FR
  'negre', 'nègre', 'neger', 'negro', 'bougnoule', 'bougnoul',
  'arabe de merde', 'sale arabe', 'sale noir', 'sale blanc',
  'youpin', 'feuj', 'bridé', 'bride', 'chinetoque', 'ching chong',
  'bamboula', 'macaque', 'sous race', 'sous-race',

  // Insultes EN
  'fuck', 'shit', 'bitch', 'asshole', 'dickhead', 'motherfucker',
  'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut',
  'cunt', 'dick', 'cock', 'pussy',

  // Termes dangereux
  'hitler', 'nazi', 'isis', 'daesh', 'terroriste', 'jihad',
  'suicide', 'viol', 'violeur', 'pedophile', 'pédophile',
];

/**
 * Normalise un texte pour détecter les contournements :
 * - Lowercase
 * - Supprime accents
 * - Remplace leetspeak (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a)
 * - Supprime caractères spéciaux et espaces multiples
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime accents
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-z\s]/g, '') // garde que lettres et espaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Vérifie si un pseudo contient des termes interdits
 * @returns Le mot bloqué trouvé, ou null si OK
 */
export function checkProfanity(pseudo: string): string | null {
  const normalized = normalize(pseudo);
  // Aussi vérifier sans espaces (pour "s a l o p e" → "salope")
  const noSpaces = normalized.replace(/\s/g, '');

  for (const word of BLOCKED_WORDS) {
    const normalizedWord = normalize(word);
    if (normalized.includes(normalizedWord) || noSpaces.includes(normalizedWord)) {
      return word;
    }
  }

  return null;
}

/**
 * Vérifie si un pseudo est valide (pas injurieux)
 */
export function isPseudoClean(pseudo: string): boolean {
  return checkProfanity(pseudo) === null;
}
