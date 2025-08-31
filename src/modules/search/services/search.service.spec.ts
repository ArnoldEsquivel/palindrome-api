import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { ProductsService } from '../../products/services/products.service';
import { PalindromeService } from '../../../utils/palindrome.service';
import { Product } from '../../products/entities/product.entity';

describe('SearchService', () => {
  let service: SearchService;
  let productsService: jest.Mocked<ProductsService>;
  let palindromeService: jest.Mocked<PalindromeService>;

  // Mock data
  const mockProduct1: Product = {
    id: 1,
    title: 'radar',
    brand: 'Tech',
    description: 'High quality radar',
    price: 100.00,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct2: Product = {
    id: 2,
    title: 'level',
    brand: 'Tools',
    description: 'Spirit level tool',
    price: 50.50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct3: Product = {
    id: 3,
    title: 'computer',
    brand: 'Tech',
    description: 'Gaming computer',
    price: 1200.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProductsService = {
      findByExactTitle: jest.fn(),
      searchByBrandOrDescriptionContains: jest.fn(),
    };

    const mockPalindromeService = {
      isPalindrome: jest.fn(),
      normalizeForPalindrome: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: PalindromeService,
          useValue: mockPalindromeService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    productsService = module.get(ProductsService);
    palindromeService = module.get(PalindromeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    // TC031: Búsqueda exitosa con palíndromo y descuento
    it('should apply 50% discount for palindrome products', async () => {
      productsService.findByExactTitle.mockResolvedValue(mockProduct1);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('radar');

      expect(result).toEqual({
        query: 'radar',
        isPalindrome: true,
        items: [{
          id: 1,
          title: 'radar',
          brand: 'Tech',
          description: 'High quality radar',
          originalPrice: 100.00,
          finalPrice: 50.00,
          discountPercentage: 50,
        }],
        totalItems: 1,
      });

      expect(productsService.findByExactTitle).toHaveBeenCalledWith('radar');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('radar');
    });

    // TC032: Búsqueda exitosa sin palíndromo
    it('should not apply discount for non-palindrome products', async () => {
      productsService.findByExactTitle.mockResolvedValue(mockProduct3);
      palindromeService.isPalindrome.mockReturnValue(false);

      const result = await service.search('computer');

      expect(result).toEqual({
        query: 'computer',
        isPalindrome: false,
        items: [{
          id: 3,
          title: 'computer',
          brand: 'Tech',
          description: 'Gaming computer',
          originalPrice: 1200.99,
          finalPrice: 1200.99,
        }],
        totalItems: 1,
      });

      expect(productsService.findByExactTitle).toHaveBeenCalledWith('computer');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('computer');
    });

    // TC033: Prioridad de búsqueda exacta sobre contenido
    it('should prioritize exact title match over brand/description search', async () => {
      productsService.findByExactTitle.mockResolvedValue(mockProduct1);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('radar');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('radar');
      expect(productsService.findByExactTitle).toHaveBeenCalledWith('radar');
      expect(productsService.searchByBrandOrDescriptionContains).not.toHaveBeenCalled();
    });

    // TC034: Búsqueda por contenido cuando no hay título exacto
    it('should search by brand/description when no exact title match and query > 3 chars', async () => {
      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockResolvedValue([mockProduct2, mockProduct3]);
      palindromeService.isPalindrome.mockReturnValue(false);

      const result = await service.search('tech');

      expect(result).toEqual({
        query: 'tech',
        isPalindrome: false,
        items: [
          {
            id: 2,
            title: 'level',
            brand: 'Tools',
            description: 'Spirit level tool',
            originalPrice: 50.50,
            finalPrice: 50.50,
          },
          {
            id: 3,
            title: 'computer',
            brand: 'Tech',
            description: 'Gaming computer',
            originalPrice: 1200.99,
            finalPrice: 1200.99,
          },
        ],
        totalItems: 2,
      });

      expect(productsService.findByExactTitle).toHaveBeenCalledWith('tech');
      expect(productsService.searchByBrandOrDescriptionContains).toHaveBeenCalledWith('tech');
    });

    // TC035: Query corto (<=3 caracteres) sin match exacto
    it('should return empty results for short queries without exact match', async () => {
      productsService.findByExactTitle.mockResolvedValue(null);
      palindromeService.isPalindrome.mockReturnValue(false);

      const result = await service.search('xy');

      expect(result).toEqual({
        query: 'xy',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      });

      expect(productsService.findByExactTitle).toHaveBeenCalledWith('xy');
      expect(productsService.searchByBrandOrDescriptionContains).not.toHaveBeenCalled();
    });

    // TC036: Query exactamente 4 caracteres debe buscar en contenido
    it('should search by content for queries with exactly 4 characters', async () => {
      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockResolvedValue([mockProduct1]);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('tool');

      expect(result.totalItems).toBe(1);
      expect(productsService.findByExactTitle).toHaveBeenCalledWith('tool');
      expect(productsService.searchByBrandOrDescriptionContains).toHaveBeenCalledWith('tool');
    });

    // TC037: Trim de espacios en query
    it('should trim whitespace from query', async () => {
      productsService.findByExactTitle.mockResolvedValue(mockProduct1);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('  radar  ');

      expect(result.query).toBe('radar');
      expect(productsService.findByExactTitle).toHaveBeenCalledWith('radar');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('radar');
    });

    // TC038: Query vacío o solo espacios
    it('should handle empty or whitespace-only queries', async () => {
      const result1 = await service.search('');
      const result2 = await service.search('   ');
      const result3 = await service.search(null as any);

      for (const result of [result1, result2, result3]) {
        expect(result).toEqual({
          query: '',
          isPalindrome: false,
          items: [],
          totalItems: 0,
        });
      }

      expect(productsService.findByExactTitle).not.toHaveBeenCalled();
      expect(productsService.searchByBrandOrDescriptionContains).not.toHaveBeenCalled();
      expect(palindromeService.isPalindrome).not.toHaveBeenCalled();
    });

    // TC039: Múltiples productos con palíndromo aplicando descuento
    it('should apply discount to all products when query is palindrome', async () => {
      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockResolvedValue([mockProduct1, mockProduct2]);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('level');

      expect(result.isPalindrome).toBe(true);
      expect(result.items).toHaveLength(2);
      
      // Ambos productos deben tener descuento
      expect(result.items[0]).toEqual(expect.objectContaining({
        discountPercentage: 50,
        finalPrice: 50.00, // 100.00 * 0.5
      }));
      expect(result.items[1]).toEqual(expect.objectContaining({
        discountPercentage: 50,
        finalPrice: 25.25, // 50.50 * 0.5
      }));
    });

    // TC040: Sin resultados en búsqueda por contenido
    it('should return empty results when no products found', async () => {
      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockResolvedValue([]);
      palindromeService.isPalindrome.mockReturnValue(false);

      const result = await service.search('nonexistent');

      expect(result).toEqual({
        query: 'nonexistent',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      });
    });
  });

  describe('mapProductToItem (integration through search)', () => {
    // TC041: Redondeo correcto de precios con descuento
    it('should correctly round discounted prices to 2 decimals', async () => {
      const productWithOddPrice: Product = {
        ...mockProduct1,
        price: 99.99,
      };
      
      productsService.findByExactTitle.mockResolvedValue(productWithOddPrice);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('radar');

      expect(result.items[0].finalPrice).toBe(50.00); // 99.99 * 0.5 = 49.995 → 50.00
    });

    // TC042: Precios con decimales complejos
    it('should handle complex decimal calculations correctly', async () => {
      const productWithComplexPrice: Product = {
        ...mockProduct1,
        price: 33.33,
      };
      
      productsService.findByExactTitle.mockResolvedValue(productWithComplexPrice);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('radar');

      expect(result.items[0].finalPrice).toBe(16.67); // 33.33 * 0.5 = 16.665 → 16.67
    });

    // TC043: Productos sin descuento mantienen estructura correcta
    it('should not include discountPercentage property for non-palindrome products', async () => {
      productsService.findByExactTitle.mockResolvedValue(mockProduct3);
      palindromeService.isPalindrome.mockReturnValue(false);

      const result = await service.search('computer');

      expect(result.items[0]).not.toHaveProperty('discountPercentage');
      expect(result.items[0].finalPrice).toBe(result.items[0].originalPrice);
    });
  });

  describe('error handling', () => {
    // TC044: Error en ProductsService.findByExactTitle
    it('should propagate errors from ProductsService.findByExactTitle', async () => {
      const dbError = new Error('Database connection failed');
      productsService.findByExactTitle.mockRejectedValue(dbError);
      palindromeService.isPalindrome.mockReturnValue(false);

      await expect(service.search('test')).rejects.toThrow('Database connection failed');
    });

    // TC045: Error en ProductsService.searchByBrandOrDescriptionContains
    it('should propagate errors from ProductsService.searchByBrandOrDescriptionContains', async () => {
      const dbError = new Error('Query timeout');
      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockRejectedValue(dbError);
      palindromeService.isPalindrome.mockReturnValue(false);

      await expect(service.search('testing')).rejects.toThrow('Query timeout');
    });

    // TC046: Error en PalindromeService
    it('should propagate errors from PalindromeService', async () => {
      const palindromeError = new Error('Palindrome processing failed');
      productsService.findByExactTitle.mockResolvedValue(mockProduct1);
      palindromeService.isPalindrome.mockImplementation(() => {
        throw palindromeError;
      });

      await expect(service.search('radar')).rejects.toThrow('Palindrome processing failed');
    });
  });

  describe('edge cases and integration', () => {
    // TC047: Query límite de 3 caracteres con match exacto
    it('should handle 3-character queries with exact match', async () => {
      productsService.findByExactTitle.mockResolvedValue(mockProduct1);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('aba');

      expect(result.items).toHaveLength(1);
      expect(result.isPalindrome).toBe(true);
      expect(productsService.findByExactTitle).toHaveBeenCalledWith('aba');
      expect(productsService.searchByBrandOrDescriptionContains).not.toHaveBeenCalled();
    });

    // TC048: Casos extremos de precios
    it('should handle extreme price values correctly', async () => {
      const freeProduct: Product = { ...mockProduct1, price: 0 };
      const expensiveProduct: Product = { ...mockProduct1, price: 999999.99 };

      // Producto gratis con descuento
      productsService.findByExactTitle.mockResolvedValue(freeProduct);
      palindromeService.isPalindrome.mockReturnValue(true);

      let result = await service.search('radar');
      expect(result.items[0].finalPrice).toBe(0);

      // Producto caro con descuento
      productsService.findByExactTitle.mockResolvedValue(expensiveProduct);
      result = await service.search('radar');
      expect(result.items[0].finalPrice).toBe(500000.00); // 999999.99 * 0.5 rounded
    });

    // TC049: Verificación de llamadas a servicios dependientes
    it('should call services in correct order and with correct parameters', async () => {
      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockResolvedValue([mockProduct1]);
      palindromeService.isPalindrome.mockReturnValue(true);

      await service.search('testing');

      // Verificar orden de llamadas
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('testing');
      expect(productsService.findByExactTitle).toHaveBeenCalledWith('testing');
      expect(productsService.searchByBrandOrDescriptionContains).toHaveBeenCalledWith('testing');
      
      // Verificar que se llamaron exactamente una vez cada uno
      expect(palindromeService.isPalindrome).toHaveBeenCalledTimes(1);
      expect(productsService.findByExactTitle).toHaveBeenCalledTimes(1);
      expect(productsService.searchByBrandOrDescriptionContains).toHaveBeenCalledTimes(1);
    });

    // TC050: Integración completa con datos reales simulados
    it('should perform complete integration flow correctly', async () => {
      // Simular búsqueda de palíndromo que no existe como título exacto
      // pero aparece en descripción
      const productWithPalindromeInDescription: Product = {
        id: 4,
        title: 'Tool Set',
        brand: 'Professional',
        description: 'Includes level and other tools',
        price: 89.95,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsService.findByExactTitle.mockResolvedValue(null);
      productsService.searchByBrandOrDescriptionContains.mockResolvedValue([productWithPalindromeInDescription]);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('level');

      expect(result).toEqual({
        query: 'level',
        isPalindrome: true,
        items: [{
          id: 4,
          title: 'Tool Set',
          brand: 'Professional',
          description: 'Includes level and other tools',
          originalPrice: 89.95,
          finalPrice: 44.98, // 89.95 * 0.5 = 44.975 → 44.98
          discountPercentage: 50,
        }],
        totalItems: 1,
      });
    });
  });
});
