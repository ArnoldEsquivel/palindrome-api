import { Test, TestingModule } from '@nestjs/testing';
import { PalindromeService } from './palindrome.service';

describe('PalindromeService', () => {
  let service: PalindromeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PalindromeService],
    }).compile();

    service = module.get<PalindromeService>(PalindromeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeForPalindrome', () => {
    // TC001: Conversión a minúsculas
    it('should convert to lowercase', () => {
      expect(service.normalizeForPalindrome('ABBA')).toBe('abba');
      expect(service.normalizeForPalindrome('Level')).toBe('level');
      expect(service.normalizeForPalindrome('RADAR')).toBe('radar');
    });

    // TC002: Remoción de diacríticos
    it('should remove diacritics', () => {
      expect(service.normalizeForPalindrome('Añádir')).toBe('anadir');
      expect(service.normalizeForPalindrome('café')).toBe('cafe');
      expect(service.normalizeForPalindrome('niño')).toBe('nino');
      expect(service.normalizeForPalindrome('corazón')).toBe('corazon');
    });

    // TC003: Solo alfanuméricos
    it('should keep only alphanumeric characters', () => {
      expect(service.normalizeForPalindrome('A-man, a plan!')).toBe('amanaplan');
      expect(service.normalizeForPalindrome('12!@#34')).toBe('1234');
      expect(service.normalizeForPalindrome('a.b.c')).toBe('abc');
      expect(service.normalizeForPalindrome('test@123#')).toBe('test123');
    });

    // TC004: Edge cases
    it('should handle edge cases', () => {
      expect(service.normalizeForPalindrome('')).toBe('');
      expect(service.normalizeForPalindrome(null as any)).toBe('');
      expect(service.normalizeForPalindrome(undefined as any)).toBe('');
      expect(service.normalizeForPalindrome('   ')).toBe('');
      expect(service.normalizeForPalindrome('!@#$%')).toBe('');
    });

    // TC005: Casos complejos combinados
    it('should handle complex normalization cases', () => {
      expect(service.normalizeForPalindrome('A man, a plan, a canal: Panama!')).toBe('amanaplanacanalpanama');
      expect(service.normalizeForPalindrome('¿Fue en la sáb@na donde N@poleon no? ¡Lean!'))
        .toBe('fueenlasabnadondenpoleonnolean');
    });
  });

  describe('isPalindrome', () => {
    // TC006: Palíndromos simples
    it('should detect simple palindromes', () => {
      expect(service.isPalindrome('abba')).toBe(true);
      expect(service.isPalindrome('radar')).toBe(true);
      expect(service.isPalindrome('level')).toBe(true);
      expect(service.isPalindrome('deed')).toBe(true);
      expect(service.isPalindrome('noon')).toBe(true);
    });

    // TC007: Palíndromos case-insensitive
    it('should be case insensitive', () => {
      expect(service.isPalindrome('ABBA')).toBe(true);
      expect(service.isPalindrome('Level')).toBe(true);
      expect(service.isPalindrome('RaDaR')).toBe(true);
      expect(service.isPalindrome('AbBa')).toBe(true);
    });

    // TC008: Palíndromos con espacios y signos
    it('should handle spaces and punctuation', () => {
      expect(service.isPalindrome('A man, a plan, a canal: Panama')).toBe(true);
      expect(service.isPalindrome('race a car')).toBe(false);
      expect(service.isPalindrome('Madam, I\'m Adam')).toBe(true);
      expect(service.isPalindrome('A Santa at NASA')).toBe(true);
    });

    // TC009: Palíndromos con diacríticos
    it('should handle diacritics in palindromes', () => {
      expect(service.isPalindrome('Anita lava la tina')).toBe(true);
      expect(service.isPalindrome('A mama Roma le aviva el amor a papa')).toBe(false); // Este no es palíndromo
    });

    // TC010: Casos no palíndromos
    it('should detect non-palindromes', () => {
      expect(service.isPalindrome('hello')).toBe(false);
      expect(service.isPalindrome('world')).toBe(false);
      expect(service.isPalindrome('abc123')).toBe(false);
      expect(service.isPalindrome('test')).toBe(false);
      expect(service.isPalindrome('palindrome')).toBe(false);
    });

    // TC011: Palíndromos numéricos
    it('should detect numeric palindromes', () => {
      expect(service.isPalindrome('12321')).toBe(true);
      expect(service.isPalindrome('1234321')).toBe(true);
      expect(service.isPalindrome('12345')).toBe(false);
    });

    // TC012: Palíndromos alfanuméricos
    it('should detect alphanumeric palindromes', () => {
      expect(service.isPalindrome('a1b2b1a')).toBe(true);
      expect(service.isPalindrome('test123tset')).toBe(false);
      expect(service.isPalindrome('abc321cba')).toBe(false); // Este no es palíndromo real
    });

    // TC013: Edge cases
    it('should handle edge cases', () => {
      expect(service.isPalindrome('')).toBe(false);
      expect(service.isPalindrome('a')).toBe(false); // Menos de 3 caracteres
      expect(service.isPalindrome('ab')).toBe(false);
      expect(service.isPalindrome('aa')).toBe(false); // Menos de 3 caracteres
      expect(service.isPalindrome(null as any)).toBe(false);
      expect(service.isPalindrome(undefined as any)).toBe(false);
    });

    // TC014: Casos límite de longitud
    it('should handle various length cases', () => {
      expect(service.isPalindrome('x')).toBe(false); // Menos de 3 caracteres
      expect(service.isPalindrome('xx')).toBe(false); // Menos de 3 caracteres
      expect(service.isPalindrome('xyx')).toBe(true);
      expect(service.isPalindrome('xyyx')).toBe(true);
      expect(service.isPalindrome('xyzyx')).toBe(true);
      expect(service.isPalindrome('xyzzyx')).toBe(true);
    });

    // TC015: Casos reales del negocio
    it('should correctly identify business-relevant palindromes', () => {
      // Casos que podrían aparecer en nombres de productos
      expect(service.isPalindrome('abba')).toBe(true); // Marca conocida
      expect(service.isPalindrome('radar')).toBe(true); // Término técnico
      expect(service.isPalindrome('level')).toBe(true); // Descripción común
      expect(service.isPalindrome('civic')).toBe(true); // Modelo de auto
      expect(service.isPalindrome('rotor')).toBe(true); // Componente técnico
      
      // Casos que NO deberían ser palíndromos
      expect(service.isPalindrome('laptop')).toBe(false);
      expect(service.isPalindrome('phone')).toBe(false);
      expect(service.isPalindrome('camera')).toBe(false);
    });
  });
});
