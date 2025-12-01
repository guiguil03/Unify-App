import {
  CreateAffiliationCodeUseCase,
  CreateAffiliationCodeError,
} from '../src/domain/usecases/create-affiliation-code.usecase';
import { CodeGeneratorService } from '../src/domain/services/code-generator.service';
import { Affiliation } from '../src/domain/models/affiliation.entity';
import { IAffiliationRepository } from '../src/domain/ports/affiliation.repository.interface';

describe('CreateAffiliationCodeUseCase', () => {
  let useCase: CreateAffiliationCodeUseCase;
  let repository: jest.Mocked<IAffiliationRepository>;
  let codeGenerator: CodeGeneratorService;

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      existsByCode: jest.fn(),
      create: jest.fn(),
      findByCode: jest.fn(),
      recordUsage: jest.fn(),
      getUsagesByAffiliationId: jest.fn(),
      incrementUsageCount: jest.fn(),
    };

    codeGenerator = new CodeGeneratorService();
    useCase = new CreateAffiliationCodeUseCase(repository, codeGenerator);
  });

  it("crée un code d'affiliation quand l'utilisateur n'en a pas", async () => {
    const userId = 'user-1';
    const generatedCode = 'ABCDEFGH';

    repository.findByUserId.mockResolvedValue(null);
    repository.existsByCode.mockResolvedValue(false);
    jest.spyOn(codeGenerator, 'generate').mockReturnValue(generatedCode);

    const expectedAffiliation = {
      id: 'aff-1',
      userId,
      code: generatedCode,
      createdAt: new Date(),
      usedCount: 0,
    } as Affiliation;

    repository.create.mockResolvedValue(expectedAffiliation);

    const result = await useCase.execute(userId);

    expect(repository.findByUserId).toHaveBeenCalledWith(userId);
    expect(repository.existsByCode).toHaveBeenCalledWith(generatedCode);
    expect(repository.create).toHaveBeenCalledWith(userId, generatedCode);
    expect(result).toBe(expectedAffiliation);
  });

  it("lève une erreur si l'utilisateur a déjà un code", async () => {
    const userId = 'user-1';
    const existingAffiliation = {} as Affiliation;
    repository.findByUserId.mockResolvedValue(existingAffiliation);

    await expect(useCase.execute(userId)).rejects.toBeInstanceOf(CreateAffiliationCodeError);
  });

  it("lève une erreur s'il est impossible de générer un code unique après plusieurs tentatives", async () => {
    const userId = 'user-1';

    repository.findByUserId.mockResolvedValue(null);
    repository.existsByCode.mockResolvedValue(true);
    jest.spyOn(codeGenerator, 'generate').mockReturnValue('DUPLICAT');

    await expect(useCase.execute(userId)).rejects.toBeInstanceOf(CreateAffiliationCodeError);
  });
  it("leve une erreur si l'utilisateur utilise son propre code", async () => { 
    const userId = 'user-1';
    const code = 'ABCDEFGH';
    repository.findByUserId.mockResolvedValue({ id: 'aff-1', userId, code, createdAt: new Date(), usedCount: 0 } as Affiliation);
    repository.existsByCode.mockResolvedValue(true);
    jest.spyOn(codeGenerator, 'generate').mockReturnValue(code);
    await expect(useCase.execute(userId)).rejects.toBeInstanceOf(CreateAffiliationCodeError);
  });
});


