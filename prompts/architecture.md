# Backend — Reto **Palíndromo** (NestJS + Postgres)

---

## 0) Alcance (Scope)

* **Se implementa:**

  * **Semillas (ejemplo)** – productos con palíndromos para testing:

```ts
// Productos implementados en products.seeds.ts
[
  { title: "abba", brand: "Test Brand", description: "Test product for palindrome testing", price: 500.00 },
  { title: "Level", brand: "Level Performance", description: "Edition inspired by level with ## 10) Pruebas automáticas (implementadas)

* **Unit Tests**

  * `PalindromeService`: casos con diacríticos, espacios y signos (ej. "Anita lava la tina", "abba", "abc").
  * `ProductsService`:

    * `findByExactTitle()` con hits y misses.
    * `searchByBrandOrDescriptionContains()` con validación de longitud.
  * `SearchService`: lógica de negocio y aplicación de descuentos.
* **e2e Tests**

  * `/api/products/search?q=abba` → `isPalindrome=true`, `finalPrice=price/2`, `discountPercentage=50`.
  * `/api/products/search?q=Level` → título exacto con un producto.
  * `/api/products/search?q=ab` → `items: []` por longitud insuficiente.

> Ejecutar con `npm run test` (unit) y `npm run test:e2e` (end-to-end).ng and radar grip", price: 1010.00 },
  { title: "Radar", brand: "Radar Performance", description: "Edition inspired by radar with level cushioning and radar grip", price: 1170.00 },
  // ... más productos con y sin palíndromos en nombres de marcas/descripciones
]
``` búsqueda** de productos contra **Postgres**.
  * Regla de **50% de descuento** si la búsqueda es **palíndromo** (aplicado **solo en la respuesta**).
  * Lógica de búsqueda:

    * **Título** → **resultado exacto** (un producto).
    * **Marca**/**Descripción** → si `q.length > 3`, retornar todos los productos que **contengan** `q`.
  * **Dockerfile** del backend + **docker-compose** (api + db).
  * **README** (este documento) con pasos para ejecución local.

* **No se implementa (a propósito):** auth, CRUD de productos, health checks, paginación, filtros avanzados, normalización de acentos para búsqueda, cache, logging avanzado, métricas.

  > Esto mantiene el trabajo **estrictamente alineado** a lo pedido.

---

## 1) Estructura del proyecto

```
src/
  core/
    config/                        # Configuración con factory pattern
      config.factory.ts            # Factory con registerAs() 
      config.schema.ts             # Joi validation schema
      environments.ts              # Mapeo de archivos .env
    database/                      # Conexión a Postgres + entidades
      database.module.ts           # TypeORM con inyección de config factory
      seeds/
        seed.ts                    # Auto-seeding ejecutado desde main.ts
        products.seeds.ts          # Datos de productos con palíndromos
  utils/                           # Servicios de utilidades (NO en core/)
    palindrome.service.ts          # Servicio de evaluación de palíndromos
    palindrome.service.spec.ts
  modules/
    products/                      # Acceso a datos de productos (solo lectura)
      products.module.ts
      entities/
        product.entity.ts          # Entidad TypeORM con decoradores
      services/
        products.service.ts        # Métodos findByExactTitle y searchByBrandOrDescription
        products.service.spec.ts
    search/                        # Endpoint /api/products/search
      search.module.ts             # Importa ProductsModule y registra PalindromeService
      controllers/
        search.controller.ts
        search.controller.spec.ts
      services/
        search.service.ts          # Lógica de negocio y aplicación de descuentos
        search.service.spec.ts
      dto/
        search-query.dto.ts
        search-response.dto.ts
main.ts                            # bootstrap con auto-seeding condicional
app.module.ts                      # ConfigModule.forRoot con factory
```

> Estructura implementada: `core/config/` con factory pattern, `utils/` para servicios transversales, auto-seeding integrado.

---

## 2) Variables de entorno

Crear `.env.dev` (desarrollo), `.env.prod` (producción), `.env.test` (testing) en la raíz del backend:

**`.env.dev` (ejemplo):**
```
# Servidor
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Base de datos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/store

# Aplicación
AUTO_SEED=true
```

> Variables validadas con **Joi schema** y gestionadas por **factory pattern** con `registerAs('config', ...)`. El `ConfigModule.forRoot()` selecciona automáticamente el archivo según `NODE_ENV`.

---

## 3) Modelo de datos (Postgres)

**Tabla mínima** para el reto:

```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

* **UNIQUE(title)**: apoya la regla de “título exacto → un producto”.
* Índices adicionales **no son necesarios** para cumplir el reto con dataset pequeño.

**Semillas (ejemplo)** – mínimo 6 ítems, cuidando casos con/ sin “abba”:

```ts
[
  { title: "Z-Runner", brand: "Abba Sports", description: "Light shoes with abba pattern", price: 1200.00 },
  { title: "MoonDash", brand: "Orbit", description: "Comfort for daily running", price: 980.00 },
  { title: "ABBA Pro", brand: "Nordic", description: "ABBA limited edition", price: 2500.00 },
  { title: "Wave", brand: "Coast", description: "Casual sneakers", price: 800.00 },
  { title: "Echo", brand: "Rebound", description: "High rebound midsole", price: 1600.00 },
  { title: "Tango", brand: "Dance", description: "Designed for studio", price: 1100.00 }
]
```

---

## 4) Módulos y responsabilidades

### 4.1 `core/config` — **Factory Pattern Configuration**

* **`config.factory.ts`**: Utiliza `registerAs('config', ...)` para registrar configuración tipada.
* **`config.schema.ts`**: Schema de validación con Joi para todas las variables de entorno.
* **`environments.ts`**: Mapeo de archivos de entorno por `NODE_ENV`.
* Integrado con `ConfigModule.forRoot()` que carga factory, schema y archivos de entorno.

### 4.2 `core/database` — **DatabaseModule**

* Configuración de TypeORM con `TypeOrmModule.forRootAsync()`.
* Inyección del config factory con `inject: [config.KEY]` y `ConfigType<typeof config>`.
* Registra entidad `Product` y exporta `TypeOrmModule.forFeature([Product])`.
* Auto-seeding ejecutado desde `main.ts` con variable `AUTO_SEED`.

### 4.3 `utils/` — **Servicios de Utilidades**

* **`palindrome.service.ts`**

  * `normalizeForPalindrome(q: string): string` → minúsculas + remover **no alfanumérico** `[a-z0-9]` + normalización NFD para diacríticos.
  * `isPalindrome(q: string): boolean` → compara normalizado vs. su reverso.
* **Nota:** Se registra como provider en `SearchModule`, no como módulo independiente.

### 4.4 `modules/products` — **ProductsModule**

* **Entidad** `Product` con decoradores TypeORM: `@Entity`, `@PrimaryGeneratedColumn`, `@Column`, etc.
* **Servicio (solo lectura)**:

  * `findByExactTitle(q: string): Promise<Product | null>`

    * QueryBuilder con `LOWER(product.title) = LOWER(:title)` para case-insensitive.
  * `searchByBrandOrDescriptionContains(q: string): Promise<Product[]>`

    * QueryBuilder con `brand ILIKE :pattern OR description ILIKE :pattern`.
    * **Solo** se invoca si `q.length > 3` (validación en SearchService).

### 4.5 `modules/search` — **SearchModule**

* **Importa**: `ProductsModule` para acceso a `ProductsService`.
* **Providers**: `SearchService` y `PalindromeService` (registrado localmente).
* **Controller**: `SearchController` con endpoint único `GET /api/products/search`.
* **DTOs**: `SearchQueryDto` para validación, `SearchResponseDto` y `ProductItemDto` para respuesta.
* **Flujo en SearchService:**

  1. Validación y trimeo de query.
  2. Búsqueda por título exacto (prevalece).
  3. Si no match y `q.length > 3` → buscar en brand/description.
  4. Evaluación de palíndromo con `PalindromeService`.
  5. Mapeo con descuento del 50% si es palíndromo.
  6. Respuesta con `{ query, isPalindrome, items, totalItems }`.

---

## 5) Contrato de API

**GET** `/api/products/search?q=<string>`

* **Query param:** `q` (obligatorio).
* **Casuística:**

  * **Título exacto** → 1 producto (200).
  * **Marca/Descripción** con `q.length > 3` → N productos que **contengan** `q` (200).
  * **`q.length <= 3`** y sin título exacto → `items: []` (200).
  * Descuento 50% si `q` es **palíndromo**.

**Respuesta 200 (palíndromo):**

```json
{
  "query": "abba",
  "isPalindrome": true,
  "items": [
    {
      "id": 107,
      "title": "abba",
      "brand": "Test Brand",
      "description": "Test product for palindrome testing",
      "originalPrice": 500.00,
      "finalPrice": 250.00,
      "discountPercentage": 50
    }
  ],
  "totalItems": 1
}
```

**Respuesta 200 (no palíndromo, sin resultados):**

```json
{ 
  "query": "laptop", 
  "isPalindrome": false, 
  "items": [],
  "totalItems": 0 
}
```

> No se definen otros códigos/errores especiales: el reto no lo solicita.

---

## 6) Reglas de negocio (precisas)

* **Palíndromo:**
  `normalizeForPalindrome(q)` = minúsculas + eliminar **todo** excepto `[a-z0-9]`.
  `isPalindrome(q)` = `normalized === reverse(normalized)`.
* **Título exacto:** igualdad con el valor de `q` trimeado (case-insensitive aceptable).
  Si el dataset presentara dos títulos iguales, es un **problema de datos** (el índice `UNIQUE(title)` lo previene).
* **Brand/description contains:** aplicar **solo si** `q.length > 3`; usar `ILIKE %q%`.
* **Descuento:** se aplica **solo en la respuesta** (la tabla mantiene `price` original).
  Redondeo a 2 decimales.

---

## 7) Guía de implementación (paso a paso)

1. **Bootstrap NestJS**

   * Proyecto creado con `nest new palindrome-api`.
   * Configurado con TypeScript estricto, ESLint, Prettier.

2. **Core/Config con Factory Pattern**

   * `config.factory.ts` con `registerAs('config', ...)` y tipado fuerte.
   * `config.schema.ts` con validación Joi para todas las variables.
   * `environments.ts` para mapeo de archivos por `NODE_ENV`.
   * En `app.module.ts`: `ConfigModule.forRoot({ load: [config], validationSchema })`.

3. **Core/Database**

   * TypeORM configurado con `TypeOrmModule.forRootAsync()`.
   * Inyección de config factory con `inject: [config.KEY]`.
   * Entidad `Product` registrada con decoradores TypeORM.
   * Auto-seeding en `main.ts` condicional por variable `AUTO_SEED`.

4. **Utils/Palindrome**

   * `palindrome.service.ts` con normalización NFD para diacríticos:

     ```ts
     normalizeForPalindrome(q: string): string {
       return (q ?? '')
         .toLowerCase()
         .normalize('NFD')                // Descompone caracteres con acentos
         .replace(/[\u0300-\u036f]/g, '') // Remueve marcas diacríticas
         .replace(/[^a-z0-9]/g, '');      // Solo alfanumérico
     }
     isPalindrome(q: string): boolean {
       const s = this.normalizeForPalindrome(q);
       return s.length > 0 && s === [...s].reverse().join('');
     }
     ```

5. **ProductsModule**

   * `product.entity.ts` con decoradores TypeORM completos.
   * `products.service.ts` con QueryBuilder:

     * `findByExactTitle()`: `LOWER(product.title) = LOWER(:title)`.
     * `searchByBrandOrDescriptionContains()`: `brand ILIKE :pattern OR description ILIKE :pattern`.

6. **SearchModule**

   * Importa `ProductsModule` y registra `PalindromeService` como provider.
   * `search.controller.ts` con `GET /api/products/search`.
   * `search.service.ts` con lógica completa de negocio y mapeo de descuentos.
   * DTOs tipados para query, respuesta y items de productos.

7. **Bootstrap en main.ts**

   * Configuración CORS condicional basada en `corsOrigin`.
   * Auto-seeding condicional por `AUTO_SEED`.
   * ValidationPipe global configurado.

---

## 8) Criterios de aceptación (Backend)

1. **GET `/api/products/search?q=<título exacto>`** → responde **un** producto, `200`.
2. **GET `/api/products/search?q=<cadena>`** con `len(q) > 3` → responde **todos** los que contienen `q` en **brand** o **description**, `200`.
3. Si `q` es **palíndromo**, cada item retorna **`finalPrice = price * 0.5`**, conservando `originalPrice`.
4. Si `q.length <= 3` y no hay título exacto → `200` con `items: []`.
5. **No se muta** `price` en BD.
6. Proyecto levanta con **Docker** y BD queda poblada con seeds.

---

## 9) Docker

**Dockerfile** (Multi-stage con seguridad mejorada):

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

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copiar dependencias y build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Copiar archivo de entorno
COPY .env.dev ./.env.dev

# Cambiar permisos
RUN chown -R nestjs:nodejs /app
USER nestjs

# Exponer puerto
EXPOSE 3000

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/main.js"]
```

**docker-compose.yml** (con networks y health checks):

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
    networks:
      - palindrome-network

  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@db:5432/store
      CORS_ORIGIN: http://localhost:3001
      AUTO_SEED: "true"  # Habilita auto-seeding
    ports:
      - "3000:3000"
    networks:
      - palindrome-network
    restart: unless-stopped

volumes:
  pgdata:

networks:
  palindrome-network:
    driver: bridge
```

**Pasos de ejecución local con Docker:**

1. Verificar archivos `.env.dev` con variables requeridas.
2. `docker compose up --build` (builds, starts DB, waits for health check, starts API)
3. Auto-seeding se ejecuta automáticamente si `AUTO_SEED=true`.
4. Probar: `GET http://localhost:3000/api/products/search?q=abba`

---

## 10) Pruebas automáticas (bonus, opcional)

* **Unit**

  * `PalindromeService`: casos con diacríticos y signos (ej. “Anita lava la tina”, “abba”, “abc”).
  * `ProductsService`:

    * exact title hit vs. miss,
    * contains con len>3 vs. len<=3 (no llamada).
* **e2e**

  * `/api/products/search?q=abba` → `isPalindrome=true`, `finalPrice=price/2`.
  * `/api/products/search?q=<título exacto>` → un producto.
  * `/api/products/search?q=ab` → `items: []`.

---

## 11) Estándares de código implementados

* **TypeScript estricto** con tipos fuertes y factory patterns.
* **DTOs** con class-validator para validación de entrada y respuesta.
* **ESLint + Prettier** configurados según convenciones NestJS.
* **Inyección de dependencias** con tokens tipados (`ConfigType<typeof config>`).
* **Repository pattern** con QueryBuilder para consultas optimizadas.
* **Auto-seeding** condicional para facilitar testing y evaluación.

---

## 12) Definition of Done (DoD) - ✅ COMPLETADO

* ✅ `GET /api/products/search` funciona según reglas; probado con datasets reales.
* ✅ Palíndromo aplica 50% en **respuesta** con `originalPrice` y `finalPrice`.
* ✅ Auto-seeding ejecutado automáticamente con `AUTO_SEED=true`.
* ✅ Proyecto levanta con `docker compose up --build` con health checks.
* ✅ Multi-stage Docker con seguridad (usuario no-root, dumb-init).
* ✅ Networks y volúmenes persistentes configurados.
* ✅ Factory pattern con configuración tipada y validación Joi.
* ✅ Tests unitarios y e2e implementados y funcionando.
* ✅ API probada exitosamente con casos reales (abba, radar, level).

> **Estado**: Proyecto completamente funcional y listo para producción.

---
