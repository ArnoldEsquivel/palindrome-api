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
    imageUrl: 'https://example.com/radar.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct2: Product = {
    id: 2,
    title: 'level',
    brand: 'Tools',
    description: 'Spirit level tool',
    price: 50.50,
    imageUrl: 'https://example.com/level.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct3: Product = {
    id: 3,
    title: 'computer',
    brand: 'Tech',
    description: 'Gaming computer',
    price: 1200.99,
    imageUrl: 'https://example.com/computer.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProductsService = {
      searchAcrossAllFields: jest.fn(),
      findAll: jest.fn(),
    };

    const mockPalindromeService = {
      isPalindrome: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ProductsService, useValue: mockProductsService },
        { provide: PalindromeService, useValue: mockPalindromeService },
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
    it('should apply 50% discount for palindrome products', async () => {
      productsService.searchAcrossAllFields.mockResolvedValue([mockProduct1]);
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

      expect(productsService.searchAcrossAllFields).toHaveBeenCalledWith('radar');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('radar');
    });

    it('should not apply discount for non-palindrome products', async () => {
      productsService.searchAcrossAllFields.mockResolvedValue([mockProduct3]);
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

      expect(productsService.searchAcrossAllFields).toHaveBeenCalledWith('computer');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('computer');
    });

    it('should handle empty search by returning all products', async () => {
      const mockPaginatedProducts = {
        products: [mockProduct1, mockProduct2],
        totalItems: 2,
      };
      
      productsService.findAll.mockResolvedValue(mockPaginatedProducts);

      const result = await service.search('');

      expect(result).toEqual({
        query: '',
        isPalindrome: false,
        items: [
          {
            id: 1,
            title: 'radar',
            brand: 'Tech',
            description: 'High quality radar',
            originalPrice: 100.00,
            finalPrice: 100.00,
          },
          {
            id: 2,
            title: 'level',
            brand: 'Tools',
            description: 'Spirit level tool',
            originalPrice: 50.50,
            finalPrice: 50.50,
          }
        ],
        totalItems: 2,
      });

      expect(productsService.findAll).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    });

    it('should return empty results when no products found', async () => {
      productsService.searchAcrossAllFields.mockResolvedValue([]);
      palindromeService.isPalindrome.mockReturnValue(false);

      const result = await service.search('nonexistent');

      expect(result).toEqual({
        query: 'nonexistent',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      });

      expect(productsService.searchAcrossAllFields).toHaveBeenCalledWith('nonexistent');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('nonexistent');
    });

    it('should trim whitespace from query', async () => {
      productsService.searchAcrossAllFields.mockResolvedValue([mockProduct1]);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('  radar  ');

      expect(result.query).toBe('radar');
      expect(productsService.searchAcrossAllFields).toHaveBeenCalledWith('radar');
      expect(palindromeService.isPalindrome).toHaveBeenCalledWith('radar');
    });
  });

  describe('mapProductToItem', () => {
    it('should correctly calculate discounted prices', async () => {
      const expensiveProduct: Product = {
        id: 4,
        title: 'abba',
        brand: 'Music',
        description: 'Expensive item',
        price: 99.99,
        imageUrl: 'https://example.com/abba.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsService.searchAcrossAllFields.mockResolvedValue([expensiveProduct]);
      palindromeService.isPalindrome.mockReturnValue(true);

      const result = await service.search('abba');

      expect(result.items[0]).toEqual({
        id: 4,
        title: 'abba',
        brand: 'Music',
        description: 'Expensive item',
        originalPrice: 99.99,
        finalPrice: 50.00, // 99.99 * 0.5 = 49.995, redondeado a 50.00
        discountPercentage: 50,
      });
    });
  });
});
