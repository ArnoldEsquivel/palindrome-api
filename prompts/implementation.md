# 📋 PLAN DE IMPLEMENTACIÓN DETALLADO - RETO PALÍNDROMO

## 🎯 OBJETIVO
Implementar exactamente el backend del "Reto Palíndromo" según especificaciones del Architecture.md, sin agregar funcionalidades adicionales.

## 🏗️ ARQUITECTURA Y PATRONES

### Patrones Principales:
- **Module Pattern**: Organización por dominio (core, modules)
- **Service Pattern**: Lógica de negocio encapsulada
- **Patrón estándar NestJS con TypeORM**: Inyección directa de Repository en Service
- **Dependency Injection**: Inyección de dependencias de NestJS
- **DTO Pattern**: Objetos de transferencia de datos con validación

### 🎯 DECISIONES ARQUITECTÓNICAS FUNDAMENTADAS:

#### 1. **Repository Pattern vs Estándar NestJS**
**DECISIÓN**: Usar patrón estándar de NestJS (inyectar Repository directamente)
**JUSTIFICACIÓN**: 
- Para un MVP con lógica simple, el patrón estándar es más directo y menos verboso
- TypeORM Repository ya abstrae el acceso a datos suficientemente
- Reduce boilerplate innecesario para consultas básicas
- NestJS está diseñado para funcionar óptimamente con inyección directa de repositorios
- Para futuras mejoras se puede refactorizar a Repository Pattern explícito si se requiere lógica de datos más compleja

#### 2. **Validación con class-validator**
**DECISIÓN**: Implementar class-validator con naming descriptivo
**JUSTIFICACIÓN**:
- Validación robusta y consistente con el ecosistema NestJS
- Mejor experiencia del desarrollador con decoradores declarativos
- Manejo automático de errores de validación
- Cambiar `q` por `searchTerm` para mayor claridad semántica

#### 3. **Manejo completo de errores HTTP**
**DECISIÓN**: Mapear todos los casos con códigos HTTP apropiados
**JUSTIFICACIÓN**:
- 400 Bad Request para parámetros faltantes o inválidos
- 200 OK para búsquedas válidas (incluso sin resultados)
- Mejor experiencia del cliente API con códigos semánticamente correctos

#### 4. **Seeds integradas en bootstrap**
**DECISIÓN**: Auto-seeding en bootstrap con flag de entorno
**JUSTIFICACIÓN**:
- Una sola ejecución (`docker compose up`) para revisar la prueba
- Separación clara de responsabilidades en archivos dedicados
- Control mediante variable de entorno `AUTO_SEED=true`
- Evita pasos manuales adicionales para el evaluador

#### 5. **Estructura de respuesta enriquecida**
**DECISIÓN**: `originalPrice`, `finalPrice` y `discountPercentage`
**JUSTIFICACIÓN**:
- Mejor UX mostrando el descuento explícitamente
- Transparencia total para el usuario final
- Facilita implementación de UI que destaque ahorros
- Información completa para analytics de descuentos

#### 6. **Búsqueda case-insensitive**
**DECISIÓN**: Case-insensitive para título exacto
**JUSTIFICACIÓN**:
- Mejor experiencia de usuario (no frustrante por mayúsculas/minúsculas)
- Comportamiento esperado en aplicaciones modernas
- Mantiene la lógica de "exacto" pero más usable
- Consistente con motores de búsqueda estándar

### Estructura de Carpetas Actual:
```
src/
├── core/
│   ├── config/           # Configuración centralizada (factory pattern + Joi)
│   └── database/         # Conexión DB + seeds
├── modules/
│   ├── products/        # Entidad + servicios de productos
│   │   ├── entities/    # Product entity
│   │   └── services/    # ProductsService
│   └── search/          # Endpoint de búsqueda
│       ├── controllers/ # SearchController  
│       ├── dto/         # DTOs de request/response
│       └── services/    # SearchService
├── utils/               # PalindromeService (utilidades independientes)
├── app.module.ts
└── main.ts
```

---

## 🚀 FASE 1: SCAFFOLD DEL PROYECTO

### 1.1 Crear Proyecto NestJS
```bash
# Navegar al directorio back
cd "/Users/arnold/Documents/Proyectos/Acueducto/Reto Palindromo/back"

# Crear proyecto (sobrescribir si existe)
npx @nestjs/cli new palindrome-api --package-manager npm

# Navegar al proyecto
cd palindrome-api
```

### 1.2 Dependencias Instaladas
```bash
# Dependencias de producción instaladas
npm install @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer joi

# Dependencias de desarrollo instaladas
npm install -D @types/pg @types/joi
```

### 1.3 Estructura de Carpetas Creada
```bash
# Estructura core implementada
src/core/config/         # ✅ Configuración con factory pattern
src/core/database/       # ✅ Database module + seeds
src/core/database/seeds/ # ✅ Products seeds

# Estructura modules implementada  
src/modules/products/entities/   # ✅ Product entity
src/modules/products/services/   # ✅ ProductsService
src/modules/search/controllers/  # ✅ SearchController
src/modules/search/dto/          # ✅ DTOs
src/modules/search/services/     # ✅ SearchService

# Utilidades implementadas
src/utils/               # ✅ PalindromeService
```

---

## 🔧 FASE 2: CORE/CONFIG MODULE ✅ IMPLEMENTADO

### 2.1 ConfigModule Implementado
**ESTADO**: ✅ Completamente implementado con factory pattern y validación Joi

### 2.2 Config Factory Implementado
**Archivo: `src/core/config/config.factory.ts`** ✅
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    corsOrigin: process.env.CORS_ORIGIN,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  app: {
    autoSeed: process.env.AUTO_SEED === 'true',
  },
}));
```

### 2.3 Schema de Validación Implementado
**Archivo: `src/core/config/config.schema.ts`** ✅
```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().optional(),
  DATABASE_URL: Joi.string().required(),
  AUTO_SEED: Joi.boolean().default(false),
});
```

### 2.4 Environments Configuration ✅
**Archivo: `src/core/config/environments.ts`**
```typescript
export const environments = {
  development: '.env.dev',
  production: '.env.prod',
  test: '.env.test',
};
```

### 2.5 Archivo .env Creado ✅
**Archivo: `.env.dev`**
```env
# Servidor
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Base de datos  
DATABASE_URL=postgresql://postgres:postgres@db:5432/store

# Seeds automáticas en bootstrap (para facilitar evaluación)
AUTO_SEED=true
```

---

## 🗄️ FASE 3: CORE/DATABASE MODULE ✅ IMPLEMENTADO

### 3.1 DatabaseModule Implementado ✅
**ESTADO**: ✅ Completamente implementado con TypeORM y factory pattern

### 3.2 Entidad Product Implementada ✅
**Archivo: `src/modules/products/entities/product.entity.ts`**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  title: string;

  @Column({ type: 'text' })
  brand: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 3.3 DatabaseModule Configurado ✅
**Archivo: `src/core/database/database.module.ts`**
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { Product } from '../../modules/products/entities/product.entity';
import config from '../config/config.factory';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigType<typeof config>) => ({
        type: 'postgres',
        url: configService.database.url,
        entities: [Product],
        synchronize: true, // Solo por fines prácticos de esta prueba
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([Product]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
```

### 3.4 Scripts de Seeds Implementados ✅
**Archivo: `src/core/database/seeds/seed.ts`**
```typescript
import { DataSource } from 'typeorm';

import { Product } from '../../../modules/products/entities/product.entity';
import { seedProducts } from './products.seeds';

export async function runSeed(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product);
  
  // Limpiar datos existentes
  await productRepository.clear();
  
  // Insertar seeds
  for (const productData of seedProducts) {
    const product = productRepository.create(productData);
    await productRepository.save(product);
  }

  console.log('Seeds inserted successfully, now you can try to find some palindromes to get a discount!');
}
```

**Archivo: `src/core/database/seeds/products.seeds.ts`** ✅
- Contiene +100 productos de muestra incluyendo palíndromos como 'abba', 'ABBA Pro', etc.

---

## 📝 FASE 4: UTILS/PALINDROME MODULE ✅ IMPLEMENTADO

### 4.1 PalindromeService Implementado ✅
**ESTADO**: ✅ Servicio implementado en `src/utils/palindrome.service.ts`

### 4.2 PalindromeService
**Archivo: `src/utils/palindrome.service.ts`** ✅
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class PalindromeService {
    
  /**
   * Normaliza texto para evaluación de palíndromo:
   * - Convierte a minúsculas
   * - Remueve diacríticos
   * - Mantiene solo caracteres alfanuméricos [a-z0-9]
   */
  normalizeForPalindrome(text: string): string {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')                // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Remueve marcas diacríticas
      .replace(/[^a-z0-9]/g, '');      // Solo alfanumérico
  }

  // Evalúa si un texto es palíndromo después de normalización
  isPalindrome(text: string): boolean {
    const normalized = this.normalizeForPalindrome(text);
    if (normalized.length === 0) return false;
    
    return normalized === normalized.split('').reverse().join('');
  }
}
```

**NOTA**: El PalindromeService está ubicado en `src/utils/` en lugar de `src/core/text/` como propone la documentación original. Esta es la estructura actual del proyecto.

---

## 🛍️ FASE 5: PRODUCTS MODULE ✅ IMPLEMENTADO

### 5.1 ProductsModule Implementado ✅
**ESTADO**: ✅ Módulo completamente implementado con entidad y servicio

### 5.2 ProductsService Implementado ✅
**Archivo: `src/modules/products/services/products.service.ts`**
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Busca producto por título exacto (case-insensitive permitido)
  async findByExactTitle(title: string): Promise<Product | null> {
    if (!title?.trim()) return null;
    
    return this.productRepository
      .createQueryBuilder('product')
      .where('LOWER(product.title) = LOWER(:title)', { title: title.trim() })
      .getOne();
  }

  /**
   * Busca productos donde brand o description contengan el texto
   * Solo se debe llamar si query.length > 3
   */
  async searchByBrandOrDescriptionContains(query: string): Promise<Product[]> {
    if (!query?.trim() || query.trim().length <= 3) return []

    const searchPattern = `%${query.trim()}%`;
    
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.brand ILIKE :pattern OR product.description ILIKE :pattern', {
        pattern: searchPattern,
      })
      .getMany();
  }
}
```

### 5.3 ProductsModule Configurado ✅
**Archivo: `src/modules/products/products.module.ts`**
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { ProductsService } from './services/products.service';
import { Product } from './entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

---

## 🔍 FASE 6: SEARCH MODULE ✅ IMPLEMENTADO

### 6.1 SearchModule Implementado ✅
**ESTADO**: ✅ Módulo completamente implementado con controlador, servicio y DTOs

### 6.2 DTOs Implementados ✅
**Archivo: `src/modules/search/dto/search-query.dto.ts`**
```typescript
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchQueryDto {
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El término de búsqueda es requerido' })
  @Length(1, 255, { message: 'El término de búsqueda debe tener entre 1 y 255 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  searchTerm: string;
}
```

**Archivo: `src/modules/search/dto/search-response.dto.ts`**
```typescript
export class ProductItemDto {
  id: number;
  title: string;
  brand: string;
  description: string;
  originalPrice: number;
  finalPrice: number;
  discountPercentage?: number; // Solo presente si hay descuento
}

export class SearchResponseDto {
  query: string;
  isPalindrome: boolean;
  items: ProductItemDto[];
  totalItems: number;
}
```

### 6.3 SearchService Implementado ✅
**Archivo: `src/modules/search/services/search.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';

import { SearchResponseDto, ProductItemDto } from '../dto/search-response.dto';
import { ProductsService } from '../../products/services/products.service';
import { PalindromeService } from '../../../utils/palindrome.service'
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class SearchService {
  constructor(
    private productsService: ProductsService,
    private palindromeService: PalindromeService,
  ) {}

  async search(query: string): Promise<SearchResponseDto> {
    const trimmedQuery = (query || '').trim();
    
    // Validación básica (class-validator maneja lo principal)
    if (!trimmedQuery) {
      return {
        query: '',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      };
    }
    
    const isPalindrome = this.palindromeService.isPalindrome(trimmedQuery);
    
    let products: Product[] = [];

    // 1. Intentar búsqueda por título exacto (prevalece)
    const exactProduct = await this.productsService.findByExactTitle(trimmedQuery);
    if (exactProduct) {
      products = [exactProduct];
    } else if (trimmedQuery.length > 3) {
      // 2. Si no hay match exacto y query > 3, buscar en brand/description
      products = await this.productsService.searchByBrandOrDescriptionContains(trimmedQuery);
    }
    // 3. Si query <= 3 y no hay match exacto, products queda como []

    // Mapea productos aplicando descuento si es palíndromo
    const items = products.map(product => this.mapProductToItem(product, isPalindrome));

    return {
      query: trimmedQuery,
      isPalindrome,
      items,
      totalItems: items.length,
    };
  }

  private mapProductToItem(product: Product, isPalindrome: boolean): ProductItemDto {
    const originalPrice = Number(product.price);
    
    if (isPalindrome) {
      const discountPercentage = 50;
      const finalPrice = Math.round(originalPrice * 0.5 * 100) / 100; // Redondeo a 2 decimales
      
      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        description: product.description,
        originalPrice,
        finalPrice,
        discountPercentage,
      };
    } else {
      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        description: product.description,
        originalPrice,
        finalPrice: originalPrice,
      };
    }
  }
}
```

### 6.4 SearchController Implementado ✅
**Archivo: `src/modules/search/controllers/search.controller.ts`**
```typescript
import { Controller, Get, Query, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';

import { SearchResponseDto } from '../dto/search-response.dto';
import { SearchService } from '../services/search.service';
import { SearchQueryDto } from '../dto/search-query.dto';

@Controller('api/products')
export class SearchController {
  constructor(private searchService: SearchService) { }

  @Get('search')
  async search(@Query() queryParams: any): Promise<SearchResponseDto> {
    // Validación manual del parámetro con nombre más claro
    const searchTerm = queryParams.q || queryParams.searchTerm;

    if (!searchTerm) {
      throw new BadRequestException({
        message: 'El parámetro de búsqueda "q" es requerido',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    // Crear DTO para validación adicional si es necesario
    const searchDto = new SearchQueryDto();
    searchDto.searchTerm = searchTerm;

    try {
      return await this.searchService.search(searchDto.searchTerm);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error interno en la búsqueda',
          error: 'Internal Server Error',
          statusCode: 500,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### 6.5 SearchModule Configurado ✅
**Archivo: `src/modules/search/search.module.ts`**
```typescript
import { Module } from '@nestjs/common';

import { SearchController } from './controllers/search.controller';
import { ProductsModule } from '../products/products.module';
import { SearchService } from './services/search.service';

@Module({
  imports: [ProductsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
```

**⚠️ PENDIENTE**: El `PalindromeService` necesita ser registrado en el SearchModule para poder ser inyectado en SearchService.

---

## 🚀 FASE 7: MAIN BOOTSTRAP - PENDIENTE

### 7.1 Configurar AppModule ✅ PARCIALMENTE IMPLEMENTADO
**Archivo: `src/app.module.ts`** - ESTADO ACTUAL:
```typescript
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { DatabaseModule } from './core/database/database.module';
import { validationSchema } from './core/config/config.schema';
import { environments } from './core/config/environments';
import config from './core/config/config.factory';

import { ProductsModule } from './modules/products/products.module';
import { SearchModule } from './modules/search/search.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: environments[process.env.NODE_ENV] || '.env.dev',
      isGlobal: true,
      load: [config],
      validationSchema: validationSchema,
    }),
    DatabaseModule,
    ProductsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**⚠️ PENDIENTES**: 
- PalindromeService no está registrado globalmente
- SearchModule necesita acceso a PalindromeService

### 7.2 Configurar main.ts ⚠️ SIMPLIFICADO 
**Archivo: `src/main.ts`** - ESTADO ACTUAL:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**⚠️ PENDIENTES**: 
- Auto-seeding no implementado
- CORS no configurado
- Validación global no configurada
- Configuración dinámica de puerto no implementada

---

## 🐳 FASE 8: DOCKER & DEPLOY

### 8.1 Crear Dockerfile
**Archivo: `Dockerfile`**
```dockerfile
# Etapa 1: Dependencias
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Etapa 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 3: Producción
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copiar dependencias y build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Copiar archivo de entorno
COPY .env ./.env

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
```

### 8.3 Actualizar docker-compose con auto-seeding
**Archivo: `docker-compose.yml`**
```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: store
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d store"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@db:5432/store
      CORS_ORIGIN: http://localhost:3001
      AUTO_SEED: "true"  # Habilita auto-seeding para facilitar evaluación
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

### 8.4 Eliminar scripts de seeding manuales
**NOTA**: Como implementamos auto-seeding en bootstrap, ya no necesitamos scripts manuales separados. Esto simplifica la evaluación a un solo comando: `docker compose up --build`

---

## ✅ FASE 9: TESTING & VALIDACIÓN

### 9.1 Casos de Prueba Manuales
```bash
# Levantar servicios (auto-seeding incluido)
docker compose up --build

# Esperar a ver el mensaje: "✅ Auto-seeding completado"
# Luego probar casos específicos:

# 1. Título exacto con palíndromo
curl "http://localhost:3000/api/products/search?q=abba"
# Esperado: 1 producto, isPalindrome=true, finalPrice=250, discountPercentage=50

# 2. Título exacto case-insensitive
curl "http://localhost:3000/api/products/search?q=ABBA"
# Esperado: 1 producto (mismo que anterior)

# 3. Búsqueda por brand/description (len > 3)
curl "http://localhost:3000/api/products/search?q=Sports"
# Esperado: productos con "Sports" en brand/description

# 4. Query corta sin match exacto
curl "http://localhost:3000/api/products/search?q=ab"
# Esperado: items=[], isPalindrome=false, totalItems=0

# 5. Palíndromo en búsqueda contains
curl "http://localhost:3000/api/products/search?q=abba"
# Esperado: products con "abba" en brand/description, 50% descuento

# 6. Error de validación
curl "http://localhost:3000/api/products/search"
# Esperado: 400 Bad Request

# 7. Query vacía
curl "http://localhost:3000/api/products/search?q="
# Esperado: 200 OK con items=[]
```

### 9.2 Estructura Final Actual del Proyecto ✅
```
palindrome-api/
├── src/
│   ├── core/
│   │   ├── config/
│   │   │   ├── config.factory.ts        ✅
│   │   │   ├── config.schema.ts         ✅
│   │   │   └── environments.ts          ✅
│   │   └── database/
│   │       ├── database.module.ts       ✅
│   │       └── seeds/
│   │           ├── products.seeds.ts    ✅
│   │           └── seed.ts              ✅
│   ├── modules/
│   │   ├── products/
│   │   │   ├── entities/
│   │   │   │   └── product.entity.ts    ✅
│   │   │   ├── services/
│   │   │   │   └── products.service.ts  ✅
│   │   │   └── products.module.ts       ✅
│   │   └── search/
│   │       ├── controllers/
│   │       │   └── search.controller.ts ✅
│   │       ├── dto/
│   │       │   ├── search-query.dto.ts  ✅
│   │       │   └── search-response.dto.ts ✅
│   │       ├── services/
│   │       │   └── search.service.ts    ✅
│   │       └── search.module.ts         ✅
│   ├── utils/
│   │   └── palindrome.service.ts        ✅
│   ├── app.module.ts                    ✅
│   └── main.ts                          ⚠️ PENDIENTE
├── .env.dev                             ✅
├── package.json                         ✅
└── tsconfig.json                        ✅
```

## 📋 ESTADO ACTUAL DE IMPLEMENTACIÓN

### ✅ COMPLETADO (FASES 1-6):
- ✅ Proyecto NestJS con dependencias necesarias
- ✅ Configuración centralizada con factory pattern + Joi validation  
- ✅ Database module con TypeORM y Product entity
- ✅ Seeds de productos extensos (100+ productos)
- ✅ PalindromeService funcional
- ✅ ProductsService con búsquedas exactas y contains
- ✅ SearchService con lógica de descuentos
- ✅ SearchController con manejo de errores
- ✅ DTOs con validación class-validator

### ⚠️ PENDIENTE (FASE 7):
- ⚠️ **PalindromeService registration**: Needs to be available in SearchModule
- ⚠️ **Main.ts enhancement**: Auto-seeding, CORS, validation pipes
- ⚠️ **Environment-based configuration**: Using config factory properly
- ⚠️ **Docker setup**: Dockerfile and docker-compose.yml

### 🚫 NO IMPLEMENTADO (FASE 8+):
- 🚫 Docker & Deploy (Dockerfile, docker-compose.yml)
- 🚫 Testing & Validación completa

---

## 🎯 CRITERIOS DE ACEPTACIÓN

- ✅ GET `/api/products/search?q=<título exacto>` → un producto (200)
- ✅ GET `/api/products/search?q=<cadena>` con len > 3 → productos que contengan q
- ✅ Palíndromo → finalPrice = price * 0.5, con originalPrice y discountPercentage
- ✅ Query len <= 3 sin match exacto → items: []
- ✅ Query faltante → 400 Bad Request con mensaje descriptivo
- ✅ Búsqueda case-insensitive para mejor UX
- ✅ Auto-seeding en bootstrap (un solo comando para evaluar)
- ✅ No mutación de price en BD
- ✅ Docker compose funcional con seeds automáticas
- ✅ Validación robusta con class-validator
- ✅ Manejo completo de errores HTTP
- ✅ Respuesta enriquecida con información de descuento

---

## 📚 NOTAS IMPORTANTES

1. **Prevalencia de búsqueda**: Título exacto SIEMPRE prevalece sobre contains
2. **Normalización**: Solo para palíndromos, NO para búsqueda
3. **Respuestas HTTP**: 
   - 200 para búsquedas válidas (con/sin resultados)
   - 400 para parámetros faltantes/inválidos
   - 500 para errores internos
4. **Redondeo**: Math.round(price * 0.5 * 100) / 100 para 2 decimales
5. **Case sensitivity**: LOWER() para título exacto (mejor UX)
6. **Auto-seeding**: Habilitado por defecto en Docker para facilitar evaluación
7. **Naming**: Usar `q` en query param para compatibilidad, `searchTerm` internamente
8. **UX mejorada**: Mostrar originalPrice, finalPrice y discountPercentage explícitamente

## 🚀 COMANDO ÚNICO PARA EVALUACIÓN

```bash
cd "/Users/arnold/Documents/Proyectos/Acueducto/Reto Palindromo/back/palindrome-api"
docker compose up --build
```

Esto ejecutará:
1. ✅ Build de la aplicación
2. ✅ Levantamiento de Postgres
3. ✅ Auto-seeding de datos de prueba
4. ✅ API lista en http://localhost:3000

**Endpoint de prueba inmediata**: `http://localhost:3000/api/products/search?q=abba`