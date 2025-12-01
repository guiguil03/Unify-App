import { CodeGeneratorService } from '../src/domain/services/code-generator.service';

describe('CodeGeneratorService', () => {
  let service: CodeGeneratorService;

  beforeEach(() => {
    service = new CodeGeneratorService();
  });

  it('génère un code de 8 caractères', () => {
    const code = service.generate();
    expect(code).toHaveLength(8);
  });

  it('génère uniquement des caractères valides (sans 0, O, I, l)', () => {
    const code = service.generate();
    expect(service.isValid(code)).toBe(true);
  });

  it('valide un code correct et rejette un code invalide', () => {
    const valid = '1234ABCD';
    const invalid = 'O0I1l234';

    expect(service.isValid(valid)).toBe(true);
    expect(service.isValid(invalid)).toBe(false);
  });
});


