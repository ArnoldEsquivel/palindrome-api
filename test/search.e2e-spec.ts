import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Product } from '../src/modules/products/entities/product.entity';

describe('Search API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Aplicar la misma configuración que en main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();
    
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/products/search (GET)', () => {
    // TC071: Búsqueda exitosa con datos reales
    it('should search products successfully with real data', async () => {
      // Obtener un producto real de la base de datos
      const repository = dataSource.getRepository(Product);
      const products = await repository.find({ take: 1 });
      
      if (products.length > 0) {
        const testProduct = products[0];
        
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${testProduct.title}`)
          .expect(200);
        
        expect(response.body).toEqual(
          expect.objectContaining({
            query: testProduct.title,
            isPalindrome: expect.any(Boolean),
            items: expect.any(Array),
            totalItems: expect.any(Number),
          })
        );
        
        if (response.body.items.length > 0) {
          expect(response.body.items[0]).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              title: expect.any(String),
              brand: expect.any(String),
              description: expect.any(String),
              originalPrice: expect.any(Number),
              finalPrice: expect.any(Number),
            })
          );
        }
      }
    });

    // TC072: Búsqueda con palíndromo real si existe
    it('should apply discount for palindrome products', async () => {
      const repository = dataSource.getRepository(Product);
      const allProducts = await repository.find();
      
      // Buscar productos que sean palíndromos
      const palindromeProducts = allProducts.filter(product => {
        const normalized = product.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalized === normalized.split('').reverse().join('') && normalized.length > 0;
      });
      
      if (palindromeProducts.length > 0) {
        const palindromeProduct = palindromeProducts[0];
        
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${palindromeProduct.title}`)
          .expect(200);
        
        expect(response.body.isPalindrome).toBe(true);
        
        if (response.body.items.length > 0) {
          const foundItem = response.body.items.find(item => item.id === palindromeProduct.id);
          if (foundItem) {
            expect(foundItem.discountPercentage).toBe(50);
            expect(foundItem.finalPrice).toBe(foundItem.originalPrice * 0.5);
          }
        }
      } else {
        // Si no hay palíndromos reales, probar con un palíndromo conocido
        const response = await request(app.getHttpServer())
          .get('/api/products/search?q=radar')
          .expect(200);
        
        expect(response.body.isPalindrome).toBe(true);
        
        // Si encuentra productos, deberían tener descuento
        response.body.items.forEach(item => {
          expect(item.finalPrice).toBe(item.originalPrice * 0.5);
          expect(item.discountPercentage).toBe(50);
        });
      }
    });

    // TC073: Búsqueda sin palíndromo
    it('should not apply discount for non-palindrome products', async () => {
      const repository = dataSource.getRepository(Product);
      const allProducts = await repository.find();
      
      // Buscar productos que NO sean palíndromos
      const nonPalindromeProducts = allProducts.filter(product => {
        const normalized = product.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalized !== normalized.split('').reverse().join('') && normalized.length > 3;
      });
      
      if (nonPalindromeProducts.length > 0) {
        const nonPalindromeProduct = nonPalindromeProducts[0];
        
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${nonPalindromeProduct.title}`)
          .expect(200);
        
        expect(response.body.isPalindrome).toBe(false);
        
        if (response.body.items.length > 0) {
          const foundItem = response.body.items.find(item => item.id === nonPalindromeProduct.id);
          if (foundItem) {
            expect(foundItem.finalPrice).toBe(foundItem.originalPrice);
            expect(foundItem.discountPercentage).toBeUndefined();
          }
        }
      }
    });

    // TC074: Query parameter faltante - controller permite y devuelve todos los productos
    it('should return all products when query parameter is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search')
        .expect(200);
      
      expect(response.body).toEqual(
        expect.objectContaining({
          query: '',
          isPalindrome: false,
          items: expect.any(Array),
          totalItems: expect.any(Number),
        })
      );
      
      // Debe devolver muchos productos (todos los de la base de datos)
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    // TC075: Query parameter vacío - controller permite y devuelve todos los productos
    it('should return all products when query parameter is empty', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=')
        .expect(200);
      
      expect(response.body).toEqual(
        expect.objectContaining({
          query: '',
          isPalindrome: false,
          items: expect.any(Array),
          totalItems: expect.any(Number),
        })
      );
      
      // Debe devolver muchos productos (todos los de la base de datos)
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    // TC076: Búsqueda case insensitive
    it('should handle case insensitive searches', async () => {
      const repository = dataSource.getRepository(Product);
      const products = await repository.find({ take: 1 });
      
      if (products.length > 0) {
        const testProduct = products[0];
        const upperCaseTitle = testProduct.title.toUpperCase();
        
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${upperCaseTitle}`)
          .expect(200);
        
        expect(response.body.query).toBe(upperCaseTitle);
        
        if (response.body.items.length > 0) {
          const foundItem = response.body.items.find(item => 
            item.title.toLowerCase() === testProduct.title.toLowerCase()
          );
          expect(foundItem).toBeDefined();
        }
      }
    });

    // TC077: Query muy corto (≤ 3 caracteres) - busca en todos los campos
    it('should handle short queries correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=ab')
        .expect(200);
      
      expect(response.body).toEqual({
        query: 'ab',
        isPalindrome: false,
        items: expect.any(Array),
        totalItems: expect.any(Number),
      });
      
      // Puede devolver productos que contengan 'ab' en cualquier campo
      // No restringimos el número de resultados ya que la implementación actual busca en todos los campos
    });

    // TC078: Búsqueda por brand/description
    it('should search by brand and description content', async () => {
      const repository = dataSource.getRepository(Product);
      const products = await repository.find({ take: 10 });
      
      if (products.length > 0) {
        // Encontrar una palabra común en las marcas (>3 caracteres)
        const brandWords = products
          .map(p => p.brand.split(' '))
          .flat()
          .filter(word => word.length > 3)
          .map(word => word.toLowerCase());
        
        if (brandWords.length > 0) {
          const searchTerm = brandWords[0].substring(0, 4);
          
          const response = await request(app.getHttpServer())
            .get(`/api/products/search?q=${searchTerm}`)
            .expect(200);
          
          expect(response.body.query).toBe(searchTerm);
          expect(response.body.totalItems).toBeGreaterThanOrEqual(0);
          expect(response.body.items).toBeInstanceOf(Array);
        }
      }
    });

    // TC079: Caracteres especiales en query
    it('should handle special characters in search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=test@123')
        .expect(200);
      
      expect(response.body).toEqual(
        expect.objectContaining({
          query: 'test@123',
          isPalindrome: expect.any(Boolean),
          items: expect.any(Array),
          totalItems: expect.any(Number),
        })
      );
    });

    // TC080: Query muy largo
    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(100);
      
      const response = await request(app.getHttpServer())
        .get(`/api/products/search?q=${longQuery}`)
        .expect(200);
      
      expect(response.body.query).toBe(longQuery);
      expect(response.body.items).toBeInstanceOf(Array);
    });

    // TC081: Múltiples parámetros (solo q debería ser usado)
    it('should ignore additional query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=test&page=1&limit=10&sort=name')
        .expect(200);
      
      expect(response.body.query).toBe('test');
    });

    // TC082: Parámetro alternativo searchTerm
    it('should accept searchTerm parameter as alternative to q', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?searchTerm=test')
        .expect(200);
      
      expect(response.body.query).toBe('test');
    });

    // TC083: Prioridad de q sobre searchTerm
    it('should prioritize q parameter over searchTerm', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=priority&searchTerm=ignored')
        .expect(200);
      
      expect(response.body.query).toBe('priority');
    });
  });

  describe('Performance and Load Tests', () => {
    // TC084: Tiempo de respuesta
    it('should respond within acceptable time limits', async () => {
      const start = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/products/search?q=test')
        .expect(200);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(1000); // < 1 segundo
    });

    // TC085: Múltiples requests concurrentes
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 5;
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/api/products/search?q=test')
          .expect(200)
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(response => {
        expect(response.body).toEqual(
          expect.objectContaining({
            query: 'test',
            isPalindrome: expect.any(Boolean),
            items: expect.any(Array),
            totalItems: expect.any(Number),
          })
        );
      });
    });
  });

  describe('Application Health and Integration', () => {
    // TC086: Verificar que la aplicación está funcionando
    it('should have working application with database connection', async () => {
      expect(dataSource.isInitialized).toBe(true);
      
      const repository = dataSource.getRepository(Product);
      const productCount = await repository.count();
      
      expect(productCount).toBeGreaterThanOrEqual(0);
    });

    // TC087: Headers de respuesta correctos
    it('should return correct response headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=test')
        .expect(200);
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    // TC088: Estructura de respuesta consistente
    it('should always return consistent response structure', async () => {
      const testQueries = ['test', 'abba', 'xy', 'nonexistent12345'];
      
      for (const query of testQueries) {
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${query}`)
          .expect(200);
        
        expect(response.body).toEqual(
          expect.objectContaining({
            query: expect.any(String),
            isPalindrome: expect.any(Boolean),
            items: expect.any(Array),
            totalItems: expect.any(Number),
          })
        );
        
        // Verificar estructura de items si existen
        if (response.body.items.length > 0) {
          response.body.items.forEach(item => {
            expect(item).toEqual(
              expect.objectContaining({
                id: expect.any(Number),
                title: expect.any(String),
                brand: expect.any(String),
                description: expect.any(String),
                originalPrice: expect.any(Number),
                finalPrice: expect.any(Number),
              })
            );
          });
        }
      }
    });

    // TC089: Integración completa palindrome + discount
    it('should correctly integrate palindrome detection with discount application', async () => {
      const palindromeQueries = ['abba', 'radar', 'level', 'civic', 'kayak'];
      
      for (const query of palindromeQueries) {
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${query}`)
          .expect(200);
        
        expect(response.body.isPalindrome).toBe(true);
        
        // Si encuentra productos, todos deberían tener descuento
        response.body.items.forEach(item => {
          expect(item.discountPercentage).toBe(50);
          expect(item.finalPrice).toBe(item.originalPrice * 0.5);
          expect(item.finalPrice).toBeLessThan(item.originalPrice);
        });
      }
    });

    // TC090: Flujo completo E2E con datos reales
    it('should complete full E2E flow with real database data', async () => {
      // 1. Verificar conexión a base de datos
      expect(dataSource.isInitialized).toBe(true);
      
      // 2. Obtener datos reales
      const repository = dataSource.getRepository(Product);
      const products = await repository.find({ take: 3 });
      
      if (products.length > 0) {
        const testProduct = products[0];
        
        // 3. Hacer búsqueda HTTP real
        const response = await request(app.getHttpServer())
          .get(`/api/products/search?q=${testProduct.title}`)
          .expect(200);
        
        // 4. Verificar respuesta completa
        expect(response.body.query).toBe(testProduct.title);
        expect(response.body.totalItems).toBeGreaterThan(0);
        
        // 5. Verificar que el producto encontrado coincide
        const foundItem = response.body.items.find(item => item.id === testProduct.id);
        expect(foundItem).toBeDefined();
        expect(foundItem.title).toBe(testProduct.title);
        expect(foundItem.originalPrice).toBe(Number(testProduct.price));
        
        // 6. Verificar lógica de palíndromo
        const isPalindromeExpected = testProduct.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const palindromeCheck = isPalindromeExpected === isPalindromeExpected.split('').reverse().join('');
        
        expect(response.body.isPalindrome).toBe(palindromeCheck && isPalindromeExpected.length > 0);
        
        if (response.body.isPalindrome) {
          expect(foundItem.finalPrice).toBe(foundItem.originalPrice * 0.5);
        } else {
          expect(foundItem.finalPrice).toBe(foundItem.originalPrice);
        }
      }
    });
  });
});
