// Entité métier : Affiliation
// Représente un code d'affiliation dans le domaine métier

export class Affiliation {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly code: string,
    public readonly createdAt: Date,
    public readonly usedCount: number = 0
  ) {}

  // Méthodes métier
  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  incrementUsage(): Affiliation {
    return new Affiliation(
      this.id,
      this.userId,
      this.code,
      this.createdAt,
      this.usedCount + 1
    );
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      code: this.code,
      createdAt: this.createdAt.toISOString(),
      usedCount: this.usedCount,
    };
  }
}
