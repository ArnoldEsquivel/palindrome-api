import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;
  let mockQueryBuilder: jest.Mocked<Partial<SelectQueryBuilder<Product>>>;

  // Mock del QueryBuilder
  const createMockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  });

  // Mock del Repository
  const mockProductRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockQueryBuilder = createMockQueryBuilder() as jest.Mocked<Partial<SelectQueryBuilder<Product>>>;
    mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('findByExactTitle', () => {
    const mockProduct: Product = {
      id: 1,
      title: 'abba',
      brand: 'Test Brand',
      description: 'Test product for palindrome testing',
      price: 500,
      imageUrl: 'https://example.com/abba.jpg',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    // TC010: Encuentra producto existente
    it('should find existing product by exact title', async () => {
      mockQueryBuilder.getOne!.mockResolvedValue(mockProduct);

      const result = await service.findByExactTitle('abba');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(product.title) = LOWER(:title)',
        { title: 'abba' }
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    // TC011: Case-insensitive búsqueda
    it('should be case insensitive', async () => {
      const levelProduct: Product = { 
        ...mockProduct, 
        id: 2, 
        title: 'Level', 
        price: 1010 
      };
      mockQueryBuilder.getOne!.mockResolvedValue(levelProduct);

      const result = await service.findByExactTitle('LEVEL');

      expect(result).toEqual(levelProduct);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(product.title) = LOWER(:title)',
        { title: 'LEVEL' }
      );
    });

    // TC012: Producto no encontrado
    it('should return null for non-existing product', async () => {
      mockQueryBuilder.getOne!.mockResolvedValue(null);

      const result = await service.findByExactTitle('nonexistent');

      expect(result).toBeNull();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(product.title) = LOWER(:title)',
        { title: 'nonexistent' }
      );
    });

    // TC013: Trim de espacios
    it('should trim whitespace from title', async () => {
      mockQueryBuilder.getOne!.mockResolvedValue(mockProduct);

      const result = await service.findByExactTitle('  abba  ');

      expect(result).toEqual(mockProduct);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(product.title) = LOWER(:title)',
        { title: 'abba' } // Verificamos que se hizo trim
      );
    });

    // TC014: Edge cases
    it('should handle edge cases', async () => {
      // String vacío
      expect(await service.findByExactTitle('')).toBeNull();
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();

      // String solo espacios
      expect(await service.findByExactTitle('   ')).toBeNull();
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();

      // Null
      expect(await service.findByExactTitle(null as any)).toBeNull();
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();

      // Undefined
      expect(await service.findByExactTitle(undefined as any)).toBeNull();
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    // TC015: Múltiples productos con mismo título (caso improbable pero robusto)
    it('should return first match when multiple exist', async () => {
      // Aunque no debería pasar por el UNIQUE constraint, test de robustez
      mockQueryBuilder.getOne!.mockResolvedValue(mockProduct);

      const result = await service.findByExactTitle('abba');

      expect(result).toEqual(mockProduct);
      expect(mockQueryBuilder.getOne).toHaveBeenCalled(); // getOne, no getMany
    });

    // TC016: Caracteres especiales en título
    it('should handle special characters in title', async () => {
      const specialProduct: Product = { 
        ...mockProduct, 
        title: 'Test-123!@#' 
      };
      mockQueryBuilder.getOne!.mockResolvedValue(specialProduct);

      const result = await service.findByExactTitle('Test-123!@#');

      expect(result).toEqual(specialProduct);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(product.title) = LOWER(:title)',
        { title: 'Test-123!@#' }
      );
    });

    // TC017: Títulos muy largos
    it('should handle long titles', async () => {
      const longTitle = 'A'.repeat(100) + ' Very Long Product Title ' + 'B'.repeat(100);
      const longTitleProduct: Product = { 
        ...mockProduct, 
        title: longTitle 
      };
      mockQueryBuilder.getOne!.mockResolvedValue(longTitleProduct);

      const result = await service.findByExactTitle(longTitle);

      expect(result).toEqual(longTitleProduct);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(product.title) = LOWER(:title)',
        { title: longTitle }
      );
    });

    // TC018: Error de base de datos
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockQueryBuilder.getOne!.mockRejectedValue(dbError);

      await expect(service.findByExactTitle('abba')).rejects.toThrow('Database connection failed');
    });
  });

  describe('searchByBrandOrDescriptionContains', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        title: 'Phone',
        brand: 'Radar Tech',
        description: 'Modern smartphone with great features',
        price: 800,
        imageUrl: 'https://example.com/phone.jpg',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        id: 2,
        title: 'Watch',
        brand: 'Radar Corp',
        description: 'Smart watch for fitness tracking',
        price: 300,
        imageUrl: 'https://example.com/watch.jpg',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ];

    // TC019: Búsqueda por brand
    it('should find products by brand match', async () => {
      mockQueryBuilder.getMany!.mockResolvedValue(mockProducts);

      const result = await service.searchByBrandOrDescriptionContains('radar');

      expect(result).toEqual(mockProducts);
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: '%radar%' }
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    // TC020: Búsqueda por description
    it('should find products by description match', async () => {
      const performanceProducts: Product[] = [
        {
          id: 3,
          title: 'Laptop',
          brand: 'TechCorp',
          description: 'High performance laptop for gaming',
          price: 1200,
          imageUrl: 'https://example.com/laptop.jpg',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];
      mockQueryBuilder.getMany!.mockResolvedValue(performanceProducts);

      const result = await service.searchByBrandOrDescriptionContains('performance');

      expect(result).toEqual(performanceProducts);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: '%performance%' }
      );
    });

    // TC021: Query length validation (≤ 3 caracteres)
    it('should return empty array for short queries', async () => {
      // Query de 3 caracteres exactos
      expect(await service.searchByBrandOrDescriptionContains('abc')).toEqual([]);
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();

      // Query de 2 caracteres
      expect(await service.searchByBrandOrDescriptionContains('ab')).toEqual([]);
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();

      // Query de 1 caracter
      expect(await service.searchByBrandOrDescriptionContains('a')).toEqual([]);
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    // TC022: Query de exactamente 4 caracteres (límite válido)
    it('should search for queries with exactly 4 characters', async () => {
      mockQueryBuilder.getMany!.mockResolvedValue(mockProducts);

      const result = await service.searchByBrandOrDescriptionContains('tech');

      expect(result).toEqual(mockProducts);
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: '%tech%' }
      );
    });

    // TC023: Case-insensitive search
    it('should be case insensitive', async () => {
      mockQueryBuilder.getMany!.mockResolvedValue(mockProducts);

      const result = await service.searchByBrandOrDescriptionContains('RADAR');

      expect(result).toEqual(mockProducts);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: '%RADAR%' }
      );
    });

    // TC024: Sin resultados
    it('should return empty array when no matches', async () => {
      mockQueryBuilder.getMany!.mockResolvedValue([]);

      const result = await service.searchByBrandOrDescriptionContains('nonexistent');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    // TC025: Trim de espacios en query
    it('should trim whitespace from query', async () => {
      mockQueryBuilder.getMany!.mockResolvedValue(mockProducts);

      const result = await service.searchByBrandOrDescriptionContains('  radar  ');

      expect(result).toEqual(mockProducts);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: '%radar%' } // Verificamos trim
      );
    });

    // TC026: Edge cases con strings especiales
    it('should handle edge cases', async () => {
      // String vacío
      expect(await service.searchByBrandOrDescriptionContains('')).toEqual([]);
      
      // String solo espacios
      expect(await service.searchByBrandOrDescriptionContains('   ')).toEqual([]);
      
      // Null
      expect(await service.searchByBrandOrDescriptionContains(null as any)).toEqual([]);
      
      // Undefined
      expect(await service.searchByBrandOrDescriptionContains(undefined as any)).toEqual([]);

      // Verificamos que no se llamó al query builder en ningún caso
      expect(mockProductRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    // TC027: Caracteres especiales en query
    it('should handle special characters in query', async () => {
      mockQueryBuilder.getMany!.mockResolvedValue([]);

      await service.searchByBrandOrDescriptionContains('test@123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: '%test@123%' }
      );
    });

    // TC028: Query muy largo
    it('should handle long queries', async () => {
      const longQuery = 'very long search query that spans multiple words and characters';
      mockQueryBuilder.getMany!.mockResolvedValue([]);

      await service.searchByBrandOrDescriptionContains(longQuery);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.brand ILIKE :pattern OR product.description ILIKE :pattern',
        { pattern: `%${longQuery}%` }
      );
    });

    // TC029: Error de base de datos
    it('should propagate database errors', async () => {
      const dbError = new Error('Database query failed');
      mockQueryBuilder.getMany!.mockRejectedValue(dbError);

      await expect(service.searchByBrandOrDescriptionContains('radar')).rejects.toThrow('Database query failed');
    });

    // TC030: Múltiples matches en brand y description
    it('should find matches in both brand and description', async () => {
      const mixedMatches: Product[] = [
        { 
          id: 1, 
          title: 'iPhone',
          brand: 'Apple Tech', 
          description: 'Innovative devices',
          price: 999,
          imageUrl: 'https://example.com/iphone.jpg',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        { 
          id: 2, 
          title: 'Accessory',
          brand: 'Samsung', 
          description: 'Apple-compatible accessories',
          price: 50,
          imageUrl: 'https://example.com/accessory.jpg',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];
      mockQueryBuilder.getMany!.mockResolvedValue(mixedMatches);

      const result = await service.searchByBrandOrDescriptionContains('apple');

      expect(result).toEqual(mixedMatches);
      expect(result).toHaveLength(2);
    });
  });
});
