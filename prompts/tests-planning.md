# 🧪 PLAN DETALLADO DE IMPLEMENTACIÓN DE TESTS - PALINDROME API

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis del Estado Actual](#análisis-del-estado-actual)
3. [Estrategia de Testing](#estrategia-de-testing)
4. [Arquitectura de Mocks](#arquitectura-de-mocks)
5. [Fase 1: Tests Unitarios Críticos](#fase-1-tests-unitarios-críticos)
6. [Fase 2: Tests de Integración](#fase-2-tests-de-integración)
7. [Fase 3: Tests End-to-End](#fase-3-tests-end-to-end)
8. [Fase 4: Tests de Módulos](#fase-4-tests-de-módulos)
9. [Configuración y Herramientas](#configuración-y-herramientas)
10. [Métricas de Calidad](#métricas-de-calidad)
11. [Cronograma de Implementación](#cronograma-de-implementación)

---

## 📊 RESUMEN EJECUTIVO

### Objetivo
Implementar una suite completa de tests que garantice la calidad, confiabilidad y mantenibilidad de la API de búsqueda de productos con funcionalidad de detección de palíndromos y aplicación de descuentos.

### Alcance
- **Tests Unitarios**: 15 archivos de test
- **Tests de Integración**: 4 archivos de test
- **Tests End-to-End**: 3 archivos de test
- **Coverage Target**: 90%+ en componentes críticos
- **Total Test Cases**: ~120 casos de prueba

### Justificación Técnica
La aplicación maneja lógica de negocio crítica (detección de palíndromos, cálculo de descuentos, búsquedas en base de datos) que requiere validación exhaustiva para garantizar:
- Correcta aplicación de descuentos del 50%
- Precisión en la detección de palíndromos con normalización de texto
- Robustez en las consultas de base de datos
- Manejo apropiado de casos edge y errores

---

## 🔍 ANÁLISIS DEL ESTADO ACTUAL

### Archivos de Test Existentes
```
✅ Creados pero incompletos:
- src/utils/palindrome.service.spec.ts (solo "should be defined")
- src/modules/products/services/products.service.spec.ts (solo "should be defined")  
- src/modules/search/services/search.service.spec.ts (solo "should be defined")
- src/modules/search/controllers/search.controller.spec.ts (solo "should be defined")
- test/app.e2e-spec.ts (solo test básico de "/")

❌ Faltantes por crear:
- 10+ archivos de test unitarios adicionales
- 3 archivos de test e2e específicos
- Fixtures y utilidades de testing
```

### Gaps Identificados
1. **Lógica de Negocio**: Palíndromo detection sin casos edge
2. **Base de Datos**: Sin tests de integración con TypeORM
3. **API Endpoints**: Sin validación completa de responses
4. **Error Handling**: Sin tests de manejo de errores
5. **Mocks**: Sin mocks apropiados para dependencias

---

## 🎯 ESTRATEGIA DE TESTING

### Testing Pyramid
```
    /\     E2E Tests (3 archivos)
   /  \    - Flujos completos de usuario
  /____\   - Integración real con DB
 /      \  
/________\  Unit Tests (15 archivos)
           - Lógica de negocio aislada
           - Servicios con mocks
```

### Principios de Testing
1. **Aislamiento**: Cada test es independiente
2. **Repetibilidad**: Resultados consistentes
3. **Velocidad**: Suite completa < 30 segundos
4. **Claridad**: Tests auto-documentados
5. **Cobertura**: Focus en lógica crítica de negocio

### Tipos de Tests por Componente

| Componente | Unit | Integration | E2E | Justificación |
|------------|------|-------------|-----|---------------|
| PalindromeService | ✅ | ❌ | ❌ | Lógica pura, sin dependencias |
| ProductsService | ✅ | ✅ | ❌ | Requiere validación con DB |
| SearchService | ✅ | ✅ | ✅ | Core business logic |
| SearchController | ✅ | ❌ | ✅ | API endpoint principal |
| DatabaseModule | ❌ | ✅ | ✅ | Configuración de conexión |

---

## 🎭 ARQUITECTURA DE MOCKS

### 1. Repository Mocks
```typescript
// Justificación: Aislar lógica de negocio de la capa de datos
const mockProductRepository = {
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};
```

**Casos de Uso**:
- ProductsService tests
- Simulación de resultados de DB
- Tests de error handling

### 2. Config Service Mocks
```typescript
// Justificación: Evitar dependencias de variables de entorno en tests
const mockConfigService = {
  server: { port: 3000, corsOrigin: 'http://localhost:3001' },
  database: { url: 'postgresql://test:test@localhost:5432/test' },
  app: { autoSeed: false },
};
```

**Casos de Uso**:
- DatabaseModule tests
- Bootstrap tests
- Configuration validation

### 3. Service Dependencies Mocks
```typescript
// Justificación: Testing en aislamiento de cada servicio
const mockProductsService = {
  findByExactTitle: jest.fn(),
  searchByBrandOrDescriptionContains: jest.fn(),
};

const mockPalindromeService = {
  normalizeForPalindrome: jest.fn(),
  isPalindrome: jest.fn(),
};
```

**Casos de Uso**:
- SearchService tests
- SearchController tests
- Flujo completo con resultados controlados

---

## 🚀 FASE 1: TESTS UNITARIOS CRÍTICOS

### 🔤 1.1 PalindromeService Tests
**Archivo**: `src/utils/palindrome.service.spec.ts`
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 4 horas

#### Justificación
El PalindromeService es el corazón de la lógica de negocio. Una falla aquí afecta directamente el cálculo de descuentos, impactando los ingresos del negocio.

#### Test Cases Detallados

##### 1.1.1 Normalización de Texto
```typescript
describe('normalizeForPalindrome', () => {
  // TC001: Conversión a minúsculas
  it('should convert to lowercase', () => {
    expect(service.normalizeForPalindrome('ABBA')).toBe('abba');
  });

  // TC002: Remoción de diacríticos
  it('should remove diacritics', () => {
    expect(service.normalizeForPalindrome('Añádir')).toBe('anadir');
    expect(service.normalizeForPalindrome('café')).toBe('cafe');
  });

  // TC003: Solo alfanuméricos
  it('should keep only alphanumeric characters', () => {
    expect(service.normalizeForPalindrome('A-man, a plan!')).toBe('amanplan');
    expect(service.normalizeForPalindrome('12!@#34')).toBe('1234');
  });

  // TC004: Edge cases
  it('should handle edge cases', () => {
    expect(service.normalizeForPalindrome('')).toBe('');
    expect(service.normalizeForPalindrome(null)).toBe('');
    expect(service.normalizeForPalindrome(undefined)).toBe('');
    expect(service.normalizeForPalindrome('   ')).toBe('');
  });
});
```

##### 1.1.2 Detección de Palíndromos
```typescript
describe('isPalindrome', () => {
  // TC005: Palíndromos simples
  it('should detect simple palindromes', () => {
    expect(service.isPalindrome('abba')).toBe(true);
    expect(service.isPalindrome('radar')).toBe(true);
    expect(service.isPalindrome('level')).toBe(true);
  });

  // TC006: Palíndromos case-insensitive
  it('should be case insensitive', () => {
    expect(service.isPalindrome('ABBA')).toBe(true);
    expect(service.isPalindrome('Level')).toBe(true);
    expect(service.isPalindrome('RaDaR')).toBe(true);
  });

  // TC007: Palíndromos con espacios y signos
  it('should handle spaces and punctuation', () => {
    expect(service.isPalindrome('A man, a plan, a canal: Panama')).toBe(true);
    expect(service.isPalindrome('race a car')).toBe(false);
  });

  // TC008: Casos no palíndromos
  it('should detect non-palindromes', () => {
    expect(service.isPalindrome('hello')).toBe(false);
    expect(service.isPalindrome('world')).toBe(false);
    expect(service.isPalindrome('abc123')).toBe(false);
  });

  // TC009: Edge cases
  it('should handle edge cases', () => {
    expect(service.isPalindrome('')).toBe(false);
    expect(service.isPalindrome('a')).toBe(true);
    expect(service.isPalindrome('ab')).toBe(false);
  });
});
```

**Criterios de Aceptación**:
- ✅ Todos los casos de normalización pasan
- ✅ Detección correcta en 100% de casos test
- ✅ Performance < 1ms por operación
- ✅ Cobertura 100%

---

### 🛍️ 1.2 ProductsService Tests
**Archivo**: `src/modules/products/services/products.service.spec.ts`
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 6 horas

#### Justificación
ProductsService maneja todas las consultas a la base de datos. Los errores aquí pueden resultar en productos no encontrados o búsquedas incorrectas, afectando la experiencia del usuario.

#### Setup y Mocks
```typescript
const mockProductRepository = {
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
};

beforeEach(async () => {
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
```

#### Test Cases Detallados

##### 1.2.1 findByExactTitle()
```typescript
describe('findByExactTitle', () => {
  // TC010: Encuentra producto existente
  it('should find existing product by exact title', async () => {
    const mockProduct = { id: 1, title: 'abba', price: 500 };
    mockProductRepository.createQueryBuilder().getOne.mockResolvedValue(mockProduct);

    const result = await service.findByExactTitle('abba');
    
    expect(result).toEqual(mockProduct);
    expect(repository.createQueryBuilder).toHaveBeenCalled();
  });

  // TC011: Case-insensitive búsqueda
  it('should be case insensitive', async () => {
    const mockProduct = { id: 1, title: 'Level', price: 1010 };
    mockProductRepository.createQueryBuilder().getOne.mockResolvedValue(mockProduct);

    const result = await service.findByExactTitle('LEVEL');
    
    expect(result).toEqual(mockProduct);
  });

  // TC012: Producto no encontrado
  it('should return null for non-existing product', async () => {
    mockProductRepository.createQueryBuilder().getOne.mockResolvedValue(null);

    const result = await service.findByExactTitle('nonexistent');
    
    expect(result).toBeNull();
  });

  // TC013: Trim de espacios
  it('should trim whitespace from title', async () => {
    const mockProduct = { id: 1, title: 'abba', price: 500 };
    mockProductRepository.createQueryBuilder().getOne.mockResolvedValue(mockProduct);

    const result = await service.findByExactTitle('  abba  ');
    
    expect(result).toEqual(mockProduct);
  });

  // TC014: Edge cases
  it('should handle edge cases', async () => {
    expect(await service.findByExactTitle('')).toBeNull();
    expect(await service.findByExactTitle(null)).toBeNull();
    expect(await service.findByExactTitle(undefined)).toBeNull();
  });
});
```

##### 1.2.2 searchByBrandOrDescriptionContains()
```typescript
describe('searchByBrandOrDescriptionContains', () => {
  // TC015: Búsqueda por brand
  it('should find products by brand match', async () => {
    const mockProducts = [
      { id: 1, brand: 'Radar Tech', description: 'Product 1' },
      { id: 2, brand: 'Radar Corp', description: 'Product 2' },
    ];
    mockProductRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

    const result = await service.searchByBrandOrDescriptionContains('radar');
    
    expect(result).toEqual(mockProducts);
    expect(result).toHaveLength(2);
  });

  // TC016: Búsqueda por description
  it('should find products by description match', async () => {
    const mockProducts = [
      { id: 1, brand: 'TechCorp', description: 'High performance laptop' },
    ];
    mockProductRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

    const result = await service.searchByBrandOrDescriptionContains('performance');
    
    expect(result).toEqual(mockProducts);
  });

  // TC017: Query length validation
  it('should return empty array for short queries', async () => {
    const result = await service.searchByBrandOrDescriptionContains('ab');
    
    expect(result).toEqual([]);
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  // TC018: Case-insensitive search
  it('should be case insensitive', async () => {
    const mockProducts = [{ id: 1, brand: 'TechCorp' }];
    mockProductRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

    const result = await service.searchByBrandOrDescriptionContains('TECHCORP');
    
    expect(result).toEqual(mockProducts);
  });

  // TC019: Sin resultados
  it('should return empty array when no matches', async () => {
    mockProductRepository.createQueryBuilder().getMany.mockResolvedValue([]);

    const result = await service.searchByBrandOrDescriptionContains('nonexistent');
    
    expect(result).toEqual([]);
  });
});
```

**Criterios de Aceptación**:
- ✅ Todas las consultas SQL generadas son correctas
- ✅ Manejo apropiado de casos edge
- ✅ Validación de longitud de query
- ✅ Case-insensitive funcionando
- ✅ Cobertura 95%+

---

### 🔍 1.3 SearchService Tests
**Archivo**: `src/modules/search/services/search.service.spec.ts`
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 8 horas

#### Justificación
SearchService orquesta toda la lógica de negocio principal: búsqueda de productos, detección de palíndromos y aplicación de descuentos. Es el componente más crítico del sistema.

#### Setup y Mocks
```typescript
const mockProductsService = {
  findByExactTitle: jest.fn(),
  searchByBrandOrDescriptionContains: jest.fn(),
};

const mockPalindromeService = {
  isPalindrome: jest.fn(),
};

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SearchService,
      { provide: ProductsService, useValue: mockProductsService },
      { provide: PalindromeService, useValue: mockPalindromeService },
    ],
  }).compile();

  service = module.get<SearchService>(SearchService);
});
```

#### Test Cases Detallados

##### 1.3.1 Flujo de Búsqueda Principal
```typescript
describe('search', () => {
  // TC020: Título exacto con palíndromo
  it('should find exact title with palindrome discount', async () => {
    const mockProduct = { id: 1, title: 'abba', price: 500 };
    mockProductsService.findByExactTitle.mockResolvedValue(mockProduct);
    mockPalindromeService.isPalindrome.mockReturnValue(true);

    const result = await service.search('abba');

    expect(result).toEqual({
      query: 'abba',
      isPalindrome: true,
      items: [{
        id: 1,
        title: 'abba',
        originalPrice: 500,
        finalPrice: 250,
        discountPercentage: 50,
      }],
      totalItems: 1,
    });
  });

  // TC021: Título exacto sin palíndromo
  it('should find exact title without discount', async () => {
    const mockProduct = { id: 2, title: 'laptop', price: 1200 };
    mockProductsService.findByExactTitle.mockResolvedValue(mockProduct);
    mockPalindromeService.isPalindrome.mockReturnValue(false);

    const result = await service.search('laptop');

    expect(result).toEqual({
      query: 'laptop',
      isPalindrome: false,
      items: [{
        id: 2,
        title: 'laptop',
        originalPrice: 1200,
        finalPrice: 1200,
      }],
      totalItems: 1,
    });
  });

  // TC022: Búsqueda por brand/description con palíndromo
  it('should search by brand/description with palindrome', async () => {
    mockProductsService.findByExactTitle.mockResolvedValue(null);
    const mockProducts = [
      { id: 3, title: 'Phone', brand: 'Radar Tech', price: 800 },
      { id: 4, title: 'Watch', brand: 'Radar Corp', price: 300 },
    ];
    mockProductsService.searchByBrandOrDescriptionContains.mockResolvedValue(mockProducts);
    mockPalindromeService.isPalindrome.mockReturnValue(true);

    const result = await service.search('radar');

    expect(result.isPalindrome).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].finalPrice).toBe(400); // 50% de 800
    expect(result.items[1].finalPrice).toBe(150); // 50% de 300
  });

  // TC023: Query corto sin título exacto
  it('should return empty for short query without exact match', async () => {
    mockProductsService.findByExactTitle.mockResolvedValue(null);
    mockPalindromeService.isPalindrome.mockReturnValue(false);

    const result = await service.search('ab');

    expect(result).toEqual({
      query: 'ab',
      isPalindrome: false,
      items: [],
      totalItems: 0,
    });
    expect(mockProductsService.searchByBrandOrDescriptionContains).not.toHaveBeenCalled();
  });

  // TC024: Query vacío
  it('should handle empty query', async () => {
    const result = await service.search('');

    expect(result).toEqual({
      query: '',
      isPalindrome: false,
      items: [],
      totalItems: 0,
    });
  });
});
```

##### 1.3.2 Mapeo de Productos
```typescript
describe('mapProductToItem', () => {
  // TC025: Con descuento palindrómico
  it('should apply palindrome discount correctly', () => {
    const product = { id: 1, title: 'abba', price: 500, brand: 'Test', description: 'Test' };
    
    const result = service['mapProductToItem'](product, true);

    expect(result).toEqual({
      id: 1,
      title: 'abba',
      brand: 'Test',
      description: 'Test',
      originalPrice: 500,
      finalPrice: 250,
      discountPercentage: 50,
    });
  });

  // TC026: Sin descuento
  it('should not apply discount for non-palindromes', () => {
    const product = { id: 2, title: 'laptop', price: 1200, brand: 'Tech', description: 'Device' };
    
    const result = service['mapProductToItem'](product, false);

    expect(result).toEqual({
      id: 2,
      title: 'laptop',
      brand: 'Tech',
      description: 'Device',
      originalPrice: 1200,
      finalPrice: 1200,
    });
    expect(result.discountPercentage).toBeUndefined();
  });

  // TC027: Redondeo de precios
  it('should round prices correctly', () => {
    const product = { id: 3, title: 'test', price: 333.33, brand: 'Test', description: 'Test' };
    
    const result = service['mapProductToItem'](product, true);

    expect(result.finalPrice).toBe(166.67); // Redondeado a 2 decimales
  });
});
```

**Criterios de Aceptación**:
- ✅ Lógica de búsqueda por prioridad funciona correctamente
- ✅ Descuentos se aplican solo para palíndromos
- ✅ Cálculos de precios son exactos
- ✅ Responses tienen estructura correcta
- ✅ Cobertura 95%+

---

### 🎮 1.4 SearchController Tests
**Archivo**: `src/modules/search/controllers/search.controller.spec.ts`
**Prioridad**: 🟡 ALTA
**Estimación**: 4 horas

#### Justificación
SearchController es el punto de entrada de la API. Debe validar correctamente las entradas y manejar errores apropiadamente para mantener la estabilidad del sistema.

#### Test Cases Detallados
```typescript
describe('SearchController', () => {
  // TC028: Búsqueda exitosa
  it('should return search results successfully', async () => {
    const mockResponse = {
      query: 'abba',
      isPalindrome: true,
      items: [{ id: 1, title: 'abba', finalPrice: 250 }],
      totalItems: 1,
    };
    mockSearchService.search.mockResolvedValue(mockResponse);

    const result = await controller.search({ q: 'abba' });

    expect(result).toEqual(mockResponse);
    expect(mockSearchService.search).toHaveBeenCalledWith('abba');
  });

  // TC029: Query parameter faltante
  it('should throw BadRequestException for missing query', async () => {
    await expect(controller.search({})).rejects.toThrow(BadRequestException);
  });

  // TC030: Query parameter vacío
  it('should throw BadRequestException for empty query', async () => {
    await expect(controller.search({ q: '' })).rejects.toThrow(BadRequestException);
  });

  // TC031: Manejo de errores internos
  it('should handle internal errors', async () => {
    mockSearchService.search.mockRejectedValue(new Error('Database error'));

    await expect(controller.search({ q: 'test' })).rejects.toThrow(HttpException);
  });
});
```

---

## 🔗 FASE 2: TESTS DE INTEGRACIÓN

### 🗄️ 2.1 Database Integration Tests
**Archivo**: `test/database.e2e-spec.ts`
**Prioridad**: 🟡 ALTA
**Estimación**: 6 horas

#### Justificación
Los tests de integración de base de datos validan que TypeORM, las entities y las consultas funcionen correctamente con PostgreSQL real.

#### Setup de Testing Database
```typescript
describe('Database Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [testConfig], // Configuración específica para tests
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433, // Puerto diferente para tests
          username: 'test',
          password: 'test',
          database: 'test_db',
          entities: [Product],
          synchronize: true,
          dropSchema: true, // Limpia DB en cada test
        }),
        ProductsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Limpia y siembra datos de prueba
    await dataSource.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
    await seedTestData(dataSource);
  });
});
```

#### Test Cases de Integración
```typescript
// TC032: Conexión a base de datos
it('should connect to test database', async () => {
  expect(dataSource.isInitialized).toBe(true);
});

// TC033: CRUD operations funcionan
it('should perform CRUD operations', async () => {
  const productsService = app.get<ProductsService>(ProductsService);
  
  // Test findByExactTitle con DB real
  const product = await productsService.findByExactTitle('abba');
  expect(product).toBeDefined();
  expect(product.title).toBe('abba');
});

// TC034: Consultas complejas
it('should execute complex queries', async () => {
  const productsService = app.get<ProductsService>(ProductsService);
  
  const products = await productsService.searchByBrandOrDescriptionContains('radar');
  expect(products.length).toBeGreaterThan(0);
});
```

---

## 🌐 FASE 3: TESTS END-TO-END

### 🚀 3.1 API Endpoints E2E Tests
**Archivo**: `test/search.e2e-spec.ts`
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 8 horas

#### Justificación
Los tests E2E validan el flujo completo desde la petición HTTP hasta la respuesta, incluyendo toda la stack de la aplicación.

#### Setup E2E Environment
```typescript
describe('Search API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideModule(DatabaseModule)
    .useModule(TestDatabaseModule) // Base de datos de prueba
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Aplicar misma configuración que main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();
    
    // Seed test data
    await seedE2ETestData(app);
  });
});
```

#### Test Cases E2E Detallados
```typescript
// TC035: Búsqueda palindrómica exitosa
it('/api/products/search?q=abba (GET) - Palindrome with discount', () => {
  return request(app.getHttpServer())
    .get('/api/products/search?q=abba')
    .expect(200)
    .expect((res) => {
      expect(res.body).toMatchObject({
        query: 'abba',
        isPalindrome: true,
        totalItems: 1,
      });
      expect(res.body.items[0]).toMatchObject({
        title: 'abba',
        originalPrice: 500,
        finalPrice: 250,
        discountPercentage: 50,
      });
    });
});

// TC036: Búsqueda no palindrómica
it('/api/products/search?q=laptop (GET) - No palindrome', () => {
  return request(app.getHttpServer())
    .get('/api/products/search?q=laptop')
    .expect(200)
    .expect((res) => {
      expect(res.body).toMatchObject({
        query: 'laptop',
        isPalindrome: false,
        totalItems: 1,
      });
      expect(res.body.items[0].finalPrice).toBe(res.body.items[0].originalPrice);
    });
});

// TC037: Query parameter faltante
it('/api/products/search (GET) - Missing query parameter', () => {
  return request(app.getHttpServer())
    .get('/api/products/search')
    .expect(400)
    .expect((res) => {
      expect(res.body).toMatchObject({
        message: 'El parámetro de búsqueda "q" es requerido',
        statusCode: 400,
      });
    });
});

// TC038: Búsqueda por brand/description
it('/api/products/search?q=radar (GET) - Brand/description search with palindrome', () => {
  return request(app.getHttpServer())
    .get('/api/products/search?q=radar')
    .expect(200)
    .expect((res) => {
      expect(res.body.isPalindrome).toBe(true);
      expect(res.body.items.length).toBeGreaterThan(0);
      res.body.items.forEach(item => {
        expect(item.finalPrice).toBe(item.originalPrice * 0.5);
      });
    });
});

// TC039: Case insensitive
it('/api/products/search?q=ABBA (GET) - Case insensitive', () => {
  return request(app.getHttpServer())
    .get('/api/products/search?q=ABBA')
    .expect(200)
    .expect((res) => {
      expect(res.body.isPalindrome).toBe(true);
    });
});

// TC040: Query muy corto
it('/api/products/search?q=ab (GET) - Short query', () => {
  return request(app.getHttpServer())
    .get('/api/products/search?q=ab')
    .expect(200)
    .expect((res) => {
      expect(res.body).toMatchObject({
        query: 'ab',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      });
    });
});
```

### 🎯 3.2 Performance E2E Tests
```typescript
describe('Performance Tests', () => {
  // TC041: Response time
  it('should respond within acceptable time limits', async () => {
    const start = Date.now();
    
    await request(app.getHttpServer())
      .get('/api/products/search?q=abba')
      .expect(200);
    
    const responseTime = Date.now() - start;
    expect(responseTime).toBeLessThan(500); // < 500ms
  });

  // TC042: Multiple concurrent requests
  it('should handle concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, () =>
      request(app.getHttpServer())
        .get('/api/products/search?q=radar')
        .expect(200)
    );
    
    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result.body.isPalindrome).toBe(true);
    });
  });
});
```

---

## 🧩 FASE 4: TESTS DE MÓDULOS

### 📦 4.1 Module Configuration Tests
**Estimación**: 3 horas cada uno

#### ProductsModule Tests
```typescript
// TC043: Module initialization
describe('ProductsModule', () => {
  it('should compile successfully', async () => {
    const module = await Test.createTestingModule({
      imports: [ProductsModule, TypeOrmTestingModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide ProductsService', async () => {
    const module = await Test.createTestingModule({
      imports: [ProductsModule, TypeOrmTestingModule],
    }).compile();

    const service = module.get<ProductsService>(ProductsService);
    expect(service).toBeDefined();
  });
});
```

#### SearchModule Tests
```typescript
// TC044: Dependencies injection
describe('SearchModule', () => {
  it('should inject all required dependencies', async () => {
    const module = await Test.createTestingModule({
      imports: [SearchModule],
    })
    .useMocker((token) => {
      if (token === ProductsService) return mockProductsService;
      return {};
    })
    .compile();

    const service = module.get<SearchService>(SearchService);
    expect(service).toBeDefined();
  });
});
```

---

## ⚙️ CONFIGURACIÓN Y HERRAMIENTAS

### Jest Configuration
```json
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThresholds: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/utils/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/modules/search/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

### Test Utilities
```typescript
// test/fixtures/test-utils.ts
export const createTestProduct = (overrides = {}) => ({
  id: 1,
  title: 'Test Product',
  brand: 'Test Brand',
  description: 'Test Description',
  price: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const seedTestData = async (dataSource: DataSource) => {
  const products = [
    createTestProduct({ id: 1, title: 'abba', price: 500 }),
    createTestProduct({ id: 2, title: 'Level', price: 1010 }),
    createTestProduct({ id: 3, title: 'Laptop', price: 1200 }),
    createTestProduct({ id: 4, title: 'Phone', brand: 'Radar Tech', price: 800 }),
  ];
  
  await dataSource.manager.save(Product, products);
};
```

---

## 📊 MÉTRICAS DE CALIDAD

### Coverage Targets
| Categoría | Target | Justificación |
|-----------|--------|---------------|
| **Servicios Críticos** | 95%+ | Lógica de negocio principal |
| **Controllers** | 90%+ | Puntos de entrada de API |
| **Utilities** | 95%+ | Funciones puras críticas |
| **Modules** | 85%+ | Configuración y wiring |
| **Overall** | 90%+ | Cobertura general del proyecto |

### Performance Targets
- **Unit Tests**: < 5 segundos total
- **Integration Tests**: < 15 segundos total  
- **E2E Tests**: < 30 segundos total
- **API Response Time**: < 500ms por request
- **Memory Usage**: < 200MB durante tests

### Quality Gates
- ✅ 0 failing tests
- ✅ Coverage targets met
- ✅ 0 ESLint errors
- ✅ 0 TypeScript errors
- ✅ All edge cases covered

---

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN

### Semana 1: Fundamentos
- **Día 1-2**: Fase 1.1 - PalindromeService Tests ✅
- **Día 3-4**: Fase 1.2 - ProductsService Tests ✅
- **Día 5**: Setup de infraestructura de testing ✅

### Semana 2: Core Business Logic  
- **Día 1-3**: Fase 1.3 - SearchService Tests ✅
- **Día 4**: Fase 1.4 - SearchController Tests ✅
- **Día 5**: Review y refactoring ✅

### Semana 3: Integration & E2E
- **Día 1-2**: Fase 2.1 - Database Integration Tests ✅
- **Día 3-4**: Fase 3.1 - API E2E Tests ✅
- **Día 5**: Fase 3.2 - Performance Tests ✅

### Semana 4: Completar & Validar
- **Día 1**: Fase 4 - Module Tests ✅
- **Día 2**: Optimización de performance ✅
- **Día 3**: Documentación y coverage reports ✅
- **Día 4**: Review final y deployment a CI/CD ✅
- **Día 5**: Buffer para ajustes ✅

---

## 🎯 ENTREGABLES

### Documentación
1. ✅ Test Plan detallado (este documento)
2. ✅ Coverage Reports por módulo
3. ✅ Performance Benchmarks
4. ✅ Test Data y Fixtures documentados

### Código
1. ✅ 22 archivos de test implementados
2. ✅ ~120 test cases cubriendo todos los escenarios
3. ✅ Mocks y utilidades de testing
4. ✅ Configuración de CI/CD para tests

### Métricas
1. ✅ Coverage > 90% overall
2. ✅ Performance < targets establecidos
3. ✅ 0 failing tests en main branch
4. ✅ Documentación de regresiones prevenidas

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgos Técnicos
1. **Dependencias de DB en tests**
   - Mitigación: Docker containers para tests aislados
   
2. **Performance degradation con muchos tests**
   - Mitigación: Paralelización y tests optimizados
   
3. **Flaky tests en CI/CD**
   - Mitigación: Retry mechanisms y timeouts apropiados

### Riesgos de Cronograma
1. **Complejidad subestimada en E2E**
   - Mitigación: Buffer time y priorización por criticidad
   
2. **Issues en setup de testing environment**
   - Mitigación: Docker compose para environments consistentes

---

**📋 Este plan asegura una cobertura exhaustiva de testing que valida tanto la funcionalidad como la calidad del código, proporcionando confianza para deployments y mantenimiento futuro del sistema.**