// Entité métier : Utilisation d'un code d'affiliation

export class AffiliationUsage {
  constructor(
    public readonly id: string,
    public readonly affiliationId: string,
    public readonly usedByUserId: string,
    public readonly usedAt: Date
  ) {}

  toJSON() {
    return {
      id: this.id,
      affiliationId: this.affiliationId,
      usedByUserId: this.usedByUserId,
      usedAt: this.usedAt.toISOString(),
    };
  }
}
