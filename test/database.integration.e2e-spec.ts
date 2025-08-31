import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { ProductsService } from '../src/modules/products/services/products.service';
import { SearchService } from '../src/modules/search/services/search.service';
import { Product } from '../src/modules/products/entities/product.entity';
import { ProductsModule } from '../src/modules/products/products.module';
import { PalindromeService } from '../src/utils/palindrome.service';
import { SearchModule } from '../src/modules/search/search.module';

describe('Database Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productsService: ProductsService;
  let searchService: SearchService;
  let palindromeService: PalindromeService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'store',
          entities: [Product],
          synchronize: false, // No alterar schema en tests
          logging: false,
        }),
        ProductsModule,
        SearchModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    dataSource = app.get(DataSource);
    productsService = app.get<ProductsService>(ProductsService);
    searchService = app.get<SearchService>(SearchService);
    palindromeService = app.get<PalindromeService>(PalindromeService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Database Connection', () => {
    // TC032: Conexión a base de datos existente
    it('should connect to existing database successfully', async () => {
      expect(dataSource.isInitialized).toBe(true);
      expect(dataSource.options.type).toBe('postgres');
    });

    // TC033: Verificar que hay datos en la base de datos
    it('should have products in the database', async () => {
      const repository = dataSource.getRepository(Product);
      const productCount = await repository.count();
      
      expect(productCount).toBeGreaterThan(0);
    });
  });

  describe('ProductsService Database Integration', () => {
    // TC034: findByExactTitle con base de datos real
    it('should find products by exact title using real database', async () => {
      // Intentar buscar un producto que probablemente existe
      const repository = dataSource.getRepository(Product);
      const allProducts = await repository.find({ take: 5 });
      
      expect(allProducts.length).toBeGreaterThan(0);
      
      // Usar un título real de la base de datos
      const firstProduct = allProducts[0];
      const foundProduct = await productsService.findByExactTitle(firstProduct.title);
      
      expect(foundProduct).toBeDefined();
      expect(foundProduct.title).toBe(firstProduct.title);
      expect(foundProduct.id).toBe(firstProduct.id);
    });

    // TC035: findByExactTitle case insensitive
    it('should find product by exact title case insensitive', async () => {
      const repository = dataSource.getRepository(Product);
      const allProducts = await repository.find({ take: 1 });
      
      if (allProducts.length > 0) {
        const product = allProducts[0];
        
        const upperCaseResult = await productsService.findByExactTitle(product.title.toUpperCase());
        const lowerCaseResult = await productsService.findByExactTitle(product.title.toLowerCase());
        
        expect(upperCaseResult).toBeDefined();
        expect(lowerCaseResult).toBeDefined();
        expect(upperCaseResult.id).toBe(product.id);
        expect(lowerCaseResult.id).toBe(product.id);
      }
    });

    // TC036: findByExactTitle producto no existente
    it('should return null for non-existing product title', async () => {
      const product = await productsService.findByExactTitle('definitely-does-not-exist-12345');
      expect(product).toBeNull();
    });

    // TC037: searchByBrandOrDescriptionContains con base de datos real
    it('should search by brand and description using real database', async () => {
      // Obtener algunas marcas/descripciones reales para buscar
      const repository = dataSource.getRepository(Product);
      const sampleProducts = await repository.find({ take: 3 });
      
      if (sampleProducts.length > 0) {
        const firstProduct = sampleProducts[0];
        
        // Buscar usando parte de la marca
        const brandQuery = firstProduct.brand.substring(0, 4).toLowerCase();
        if (brandQuery.length > 3) {
          const brandResults = await productsService.searchByBrandOrDescriptionContains(brandQuery);
          expect(brandResults.length).toBeGreaterThanOrEqual(0);
        }
        
        // Buscar usando parte de la descripción
        const descQuery = firstProduct.description.substring(0, 4).toLowerCase();
        if (descQuery.length > 3) {
          const descResults = await productsService.searchByBrandOrDescriptionContains(descQuery);
          expect(descResults.length).toBeGreaterThanOrEqual(0);
        }
      }
    });

    // TC038: searchByBrandOrDescriptionContains query corto
    it('should return empty array for queries <= 3 characters', async () => {
      const shortResults1 = await productsService.searchByBrandOrDescriptionContains('ab');
      const shortResults2 = await productsService.searchByBrandOrDescriptionContains('xyz');
      
      expect(shortResults1).toEqual([]);
      expect(shortResults2).toEqual([]);
    });
  });

  describe('Full Search Integration', () => {
    // TC039: Integración completa SearchService + ProductsService + Database
    it('should perform complete search flow with real data', async () => {
      // Obtener un producto real de la base de datos
      const repository = dataSource.getRepository(Product);
      const products = await repository.find({ take: 5 });
      
      if (products.length > 0) {
        const testProduct = products[0];
        
        // Buscar por título exacto
        const searchResult = await searchService.search(testProduct.title);
        
        expect(searchResult).toBeDefined();
        expect(searchResult.query).toBe(testProduct.title);
        expect(searchResult.items.length).toBeGreaterThanOrEqual(1);
        
        const foundItem = searchResult.items.find(item => item.id === testProduct.id);
        expect(foundItem).toBeDefined();
        expect(foundItem.title).toBe(testProduct.title);
        expect(foundItem.originalPrice).toBe(Number(testProduct.price));
      }
    });

    // TC040: Búsqueda con palíndromo real si existe
    it('should apply discount for palindrome products if they exist', async () => {
      // Buscar productos que sean palíndromos
      const repository = dataSource.getRepository(Product);
      const allProducts = await repository.find();
      
      const palindromeProducts = allProducts.filter(product => 
        palindromeService.isPalindrome(product.title)
      );
      
      if (palindromeProducts.length > 0) {
        const palindromeProduct = palindromeProducts[0];
        const searchResult = await searchService.search(palindromeProduct.title);
        
        expect(searchResult.isPalindrome).toBe(true);
        expect(searchResult.items.length).toBeGreaterThan(0);
        
        const foundItem = searchResult.items.find(item => item.id === palindromeProduct.id);
        expect(foundItem).toBeDefined();
        expect(foundItem.discountPercentage).toBe(50);
        expect(foundItem.finalPrice).toBe(foundItem.originalPrice * 0.5);
      } else {
        // Si no hay palíndromos, crear una búsqueda de palíndromo que no existe
        const searchResult = await searchService.search('abba');
        expect(searchResult.isPalindrome).toBe(true);
        expect(searchResult.items).toEqual([]);
        expect(searchResult.totalItems).toBe(0);
      }
    });

    // TC041: Búsqueda por contenido con datos reales
    it('should search by brand/description content with real data', async () => {
      const repository = dataSource.getRepository(Product);
      const products = await repository.find({ take: 10 });
      
      if (products.length > 0) {
        // Encontrar una palabra común en las marcas
        const brands = products.map(p => p.brand).filter(brand => brand.length > 4);
        
        if (brands.length > 0) {
          const searchTerm = brands[0].substring(0, 4).toLowerCase();
          const searchResult = await searchService.search(searchTerm);
          
          expect(searchResult.query).toBe(searchTerm);
          expect(searchResult.totalItems).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Performance and Consistency', () => {
    // TC042: Performance de consultas con datos reales
    it('should execute queries within acceptable time limits', async () => {
      const repository = dataSource.getRepository(Product);
      const sampleProduct = await repository.findOne({ where: {} });
      
      if (sampleProduct) {
        const start = Date.now();
        
        await productsService.findByExactTitle(sampleProduct.title);
        
        const exactTitleTime = Date.now() - start;
        expect(exactTitleTime).toBeLessThan(500); // 500ms máximo
        
        const start2 = Date.now();
        
        const searchTerm = sampleProduct.brand.substring(0, 4);
        if (searchTerm.length > 3) {
          await productsService.searchByBrandOrDescriptionContains(searchTerm);
        }
        
        const searchTime = Date.now() - start2;
        expect(searchTime).toBeLessThan(1000); // 1s máximo para búsquedas complejas
      }
    });

    // TC043: Consistencia de datos entre servicios
    it('should maintain data consistency between ProductsService and SearchService', async () => {
      const repository = dataSource.getRepository(Product);
      const testProduct = await repository.findOne({ where: {} });
      
      if (testProduct) {
        // Comparar resultado de ProductsService vs SearchService
        const directResult = await productsService.findByExactTitle(testProduct.title);
        const searchResult = await searchService.search(testProduct.title);
        
        expect(directResult).toBeDefined();
        expect(searchResult.items.length).toBeGreaterThan(0);
        
        const searchItem = searchResult.items.find(item => item.id === testProduct.id);
        expect(searchItem).toBeDefined();
        expect(searchItem.title).toBe(directResult.title);
        expect(searchItem.originalPrice).toBe(Number(directResult.price));
      }
    });
  });
});
