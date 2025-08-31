import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from '../services/search.service';
import { SearchResponseDto } from '../dto/search-response.dto';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<SearchService>;

  // Mock response data
  const mockSearchResponse: SearchResponseDto = {
    query: 'radar',
    isPalindrome: true,
    items: [
      {
        id: 1,
        title: 'radar',
        brand: 'Tech',
        description: 'High quality radar',
        originalPrice: 100.00,
        finalPrice: 50.00,
        discountPercentage: 50,
      },
    ],
    totalItems: 1,
  };

  const mockEmptyResponse: SearchResponseDto = {
    query: 'test',
    isPalindrome: false,
    items: [],
    totalItems: 0,
  };

  beforeEach(async () => {
    const mockSearchService = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    // TC051: Búsqueda exitosa con parámetro 'q'
    it('should return search results for valid query with "q" parameter', async () => {
      searchService.search.mockResolvedValue(mockSearchResponse);

      const result = await controller.search({ q: 'radar' });

      expect(result).toEqual(mockSearchResponse);
      expect(searchService.search).toHaveBeenCalledWith('radar');
      expect(searchService.search).toHaveBeenCalledTimes(1);
    });

    // TC052: Búsqueda exitosa con parámetro 'searchTerm'
    it('should return search results for valid query with "searchTerm" parameter', async () => {
      searchService.search.mockResolvedValue(mockSearchResponse);

      const result = await controller.search({ searchTerm: 'radar' });

      expect(result).toEqual(mockSearchResponse);
      expect(searchService.search).toHaveBeenCalledWith('radar');
    });

    // TC053: Prioridad del parámetro 'q' sobre 'searchTerm'
    it('should prioritize "q" parameter over "searchTerm" when both are present', async () => {
      searchService.search.mockResolvedValue(mockSearchResponse);

      const result = await controller.search({ q: 'radar', searchTerm: 'level' });

      expect(result).toEqual(mockSearchResponse);
      expect(searchService.search).toHaveBeenCalledWith('radar');
    });

    // TC054: Error cuando no se proporciona parámetro de búsqueda
    it('should throw BadRequestException when no search parameter is provided', async () => {
      await expect(controller.search({})).rejects.toThrow(BadRequestException);
      await expect(controller.search({})).rejects.toThrow('El parámetro de búsqueda "q" es requerido');
      
      expect(searchService.search).not.toHaveBeenCalled();
    });

    // TC055: Error cuando parámetros están presentes pero vacíos
    it('should throw BadRequestException when search parameters are empty', async () => {
      await expect(controller.search({ q: '' })).rejects.toThrow(BadRequestException);
      await expect(controller.search({ searchTerm: '' })).rejects.toThrow(BadRequestException);
      await expect(controller.search({ q: null })).rejects.toThrow(BadRequestException);
      await expect(controller.search({ q: undefined })).rejects.toThrow(BadRequestException);

      expect(searchService.search).not.toHaveBeenCalled();
    });

    // TC056: Búsqueda exitosa sin resultados
    it('should return empty results when no products are found', async () => {
      searchService.search.mockResolvedValue(mockEmptyResponse);

      const result = await controller.search({ q: 'nonexistent' });

      expect(result).toEqual(mockEmptyResponse);
      expect(searchService.search).toHaveBeenCalledWith('nonexistent');
    });

    // TC057: Manejo de caracteres especiales en query
    it('should handle special characters in search query', async () => {
      const specialCharResponse: SearchResponseDto = {
        query: 'test@123#',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      };

      searchService.search.mockResolvedValue(specialCharResponse);

      const result = await controller.search({ q: 'test@123#' });

      expect(result).toEqual(specialCharResponse);
      expect(searchService.search).toHaveBeenCalledWith('test@123#');
    });

    // TC058: Manejo de queries muy largos
    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      const longQueryResponse: SearchResponseDto = {
        query: longQuery,
        isPalindrome: false,
        items: [],
        totalItems: 0,
      };

      searchService.search.mockResolvedValue(longQueryResponse);

      const result = await controller.search({ q: longQuery });

      expect(result).toEqual(longQueryResponse);
      expect(searchService.search).toHaveBeenCalledWith(longQuery);
    });

    // TC059: Manejo de espacios en blanco en query
    it('should handle whitespace in search queries', async () => {
      const whitespaceResponse: SearchResponseDto = {
        query: '  radar  ',
        isPalindrome: true,
        items: [],
        totalItems: 0,
      };

      searchService.search.mockResolvedValue(whitespaceResponse);

      const result = await controller.search({ q: '  radar  ' });

      expect(result).toEqual(whitespaceResponse);
      expect(searchService.search).toHaveBeenCalledWith('  radar  ');
    });

    // TC060: Búsqueda case-sensitive en parámetros URL
    it('should handle case-sensitive URL parameters correctly', async () => {
      searchService.search.mockResolvedValue(mockSearchResponse);

      // Solo 'q' y 'searchTerm' deberían funcionar, otros nombres no
      const result = await controller.search({ q: 'radar' });
      expect(result).toEqual(mockSearchResponse);

      // Parámetros con nombres incorrectos deberían fallar
      await expect(controller.search({ Q: 'radar' })).rejects.toThrow(BadRequestException);
      await expect(controller.search({ search: 'radar' })).rejects.toThrow(BadRequestException);
      await expect(controller.search({ query: 'radar' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('error handling', () => {
    // TC061: Error interno del SearchService propagado como HttpException
    it('should throw HttpException when SearchService throws an error', async () => {
      const serviceError = new Error('Database connection failed');
      searchService.search.mockRejectedValue(serviceError);

      await expect(controller.search({ q: 'radar' }))
        .rejects
        .toThrow(HttpException);

      await expect(controller.search({ q: 'radar' }))
        .rejects
        .toThrow('Error interno en la búsqueda');

      const error = await controller.search({ q: 'radar' }).catch(e => e);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.getResponse()).toEqual({
        message: 'Error interno en la búsqueda',
        error: 'Internal Server Error',
        statusCode: 500,
      });
    });

    // TC062: Error de validación específico del SearchService
    it('should convert SearchService validation errors to HttpException', async () => {
      const validationError = new Error('Invalid query format');
      searchService.search.mockRejectedValue(validationError);

      const error = await controller.search({ q: 'invalid' }).catch(e => e);
      
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(500);
    });

    // TC063: Error de timeout en SearchService
    it('should handle SearchService timeout errors', async () => {
      const timeoutError = new Error('Query timeout exceeded');
      searchService.search.mockRejectedValue(timeoutError);

      await expect(controller.search({ q: 'test' }))
        .rejects
        .toThrow(HttpException);
    });

    // TC064: Verificación de estructura de error BadRequest
    it('should return proper error structure for BadRequestException', async () => {
      try {
        await controller.search({});
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          message: 'El parámetro de búsqueda "q" es requerido',
          error: 'Bad Request',
          statusCode: 400,
        });
      }
    });
  });

  describe('query parameter variations', () => {
    // TC065: Múltiples parámetros adicionales ignorados
    it('should ignore additional query parameters', async () => {
      searchService.search.mockResolvedValue(mockSearchResponse);

      const result = await controller.search({
        q: 'radar',
        page: '1',
        limit: '10',
        sort: 'name',
        filter: 'active',
      });

      expect(result).toEqual(mockSearchResponse);
      expect(searchService.search).toHaveBeenCalledWith('radar');
    });

    // TC066: Parámetros con valores numéricos
    it('should handle numeric query parameters correctly', async () => {
      const numericResponse: SearchResponseDto = {
        query: '12321',
        isPalindrome: true,
        items: [],
        totalItems: 0,
      };

      searchService.search.mockResolvedValue(numericResponse);

      const result = await controller.search({ q: 12321 });

      expect(result).toEqual(numericResponse);
      expect(searchService.search).toHaveBeenCalledWith(12321);
    });

    // TC067: Parámetros con valores booleanos
    it('should handle boolean query parameters', async () => {
      const booleanResponse: SearchResponseDto = {
        query: 'true',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      };

      searchService.search.mockResolvedValue(booleanResponse);

      const result = await controller.search({ q: true });

      expect(result).toEqual(booleanResponse);
      expect(searchService.search).toHaveBeenCalledWith(true);
    });

    // TC068: Parámetros con arrays (debería tomar el primer valor)
    it('should handle array query parameters by taking first value', async () => {
      searchService.search.mockResolvedValue(mockSearchResponse);

      // En NestJS, query arrays se representan como ['value1', 'value2']
      const result = await controller.search({ q: ['radar', 'level'] });

      expect(result).toEqual(mockSearchResponse);
      expect(searchService.search).toHaveBeenCalledWith(['radar', 'level']);
    });
  });

  describe('integration scenarios', () => {
    // TC069: Flujo completo de búsqueda exitosa con palíndromo
    it('should complete full palindrome search flow successfully', async () => {
      const palindromeResponse: SearchResponseDto = {
        query: 'level',
        isPalindrome: true,
        items: [
          {
            id: 1,
            title: 'level',
            brand: 'Tools',
            description: 'Spirit level tool',
            originalPrice: 50.00,
            finalPrice: 25.00,
            discountPercentage: 50,
          },
        ],
        totalItems: 1,
      };

      searchService.search.mockResolvedValue(palindromeResponse);

      const result = await controller.search({ q: 'level' });

      expect(result).toEqual(palindromeResponse);
      expect(result.isPalindrome).toBe(true);
      expect(result.items[0].discountPercentage).toBe(50);
      expect(result.items[0].finalPrice).toBeLessThan(result.items[0].originalPrice);
      expect(searchService.search).toHaveBeenCalledWith('level');
    });

    // TC070: Flujo completo de búsqueda sin resultados
    it('should complete full search flow with no results', async () => {
      const noResultsResponse: SearchResponseDto = {
        query: 'nonexistentproduct',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      };

      searchService.search.mockResolvedValue(noResultsResponse);

      const result = await controller.search({ q: 'nonexistentproduct' });

      expect(result).toEqual(noResultsResponse);
      expect(result.totalItems).toBe(0);
      expect(result.items).toHaveLength(0);
      expect(searchService.search).toHaveBeenCalledWith('nonexistentproduct');
    });
  });
});
