# 🎯 **PALINDROME API** - Reto de Búsqueda con Descuentos
*API REST para búsqueda de productos con detección de palíndromos y descuentos automáticos*

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg" width="120" alt="PostgreSQL Logo" style="margin-left: 20px;" />
</p>

---

## 📋 **DESCRIPCIÓN DEL PROYECTO**

**Palindrome API** es una aplicación backend desarrollada como parte del **Reto Palíndromo** para **Acueducto**. La API implementa un sistema de búsqueda inteligente de productos que:

- 🔍 **Busca productos** por título exacto o contenido en marca/descripción
- 🎯 **Detecta palíndromos** en las consultas de búsqueda  
- 💰 **Aplica descuentos automáticos** del 50% cuando la búsqueda es un palíndromo
- 🗄️ **Gestiona una base de datos** PostgreSQL con +100 productos de prueba
- 🚀 **Despliega fácilmente** con Docker y auto-seeding incluido

### **🎪 Funcionalidad Principal**
Cuando un usuario busca "**abba**", "**radar**", "**level**" u otro palíndromo, todos los productos encontrados reciben automáticamente **50% de descuento**, mostrando precio original, precio final y porcentaje de descuento.

---

## 🏗️ **ARQUITECTURA Y TECNOLOGÍAS**

### **Stack Tecnológico**
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | 10.0.0 | Framework backend progresivo |
| **TypeScript** | 5.1.3 | Lenguaje de programación tipado |
| **PostgreSQL** | 15-alpine | Base de datos relacional |
| **TypeORM** | 0.3.26 | ORM para manejo de datos |
| **Docker** | - | Containerización y despliegue |
| **Jest** | 29.5.0 | Framework de testing |

### **Patrones de Diseño Implementados**
- **🏭 Factory Pattern**: Configuración centralizada con `registerAs()`
- **💉 Dependency Injection**: Inyección de dependencias con NestJS
- **📦 Module Pattern**: Organización por dominio (core, modules, utils)
- **🛡️ DTO Pattern**: Validación de datos con class-validator
- **🔍 Repository Pattern**: Acceso a datos con TypeORM

### **Estructura del Proyecto**
```
src/
├── core/
│   ├── config/           # 🔧 Configuración centralizada con factory pattern
│   │   ├── config.factory.ts
│   │   ├── config.schema.ts
│   │   └── environments.ts
│   └── database/         # 🗄️ Conexión DB + auto-seeding
│       ├── database.module.ts
│       └── seeds/
│           ├── products.seeds.ts
│           └── seed.ts
├── modules/
│   ├── products/         # 🛍️ Gestión de productos (solo lectura)
│   │   ├── entities/
│   │   ├── services/
│   │   └── products.module.ts
│   └── search/           # 🔍 Endpoint principal de búsqueda
│       ├── controllers/
│       ├── dto/
│       ├── services/
│       └── search.module.ts
├── utils/               # 🔤 Servicios de utilidades
│   └── palindrome.service.ts
├── app.module.ts
└── main.ts
```

---

## 🚀 **INICIO RÁPIDO**

### **Prerrequisitos**
- **Docker** y **Docker Compose** instalados
- **Node.js 20+** (para desarrollo local)
- **PostgreSQL 15+** (opcional, incluido en Docker)

### **🐳 Ejecución con Docker (Recomendado)**
```bash
# Clonar el repositorio
git clone <repository-url>
cd palindrome-api

# ⚡ Un solo comando para levantar todo
docker compose up --build

# La API estará disponible en: http://localhost:3000
# ✅ Auto-seeding ejecutado automáticamente
```

### **💻 Ejecución Local (Desarrollo)**
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.dev .env

# Levantar solo la base de datos
docker compose up db -d

# Ejecutar en modo desarrollo
npm run start:dev

# La API estará disponible en: http://localhost:3000
```

---

## 🔧 **COMANDOS PRINCIPALES**

### **🏗️ Desarrollo**
```bash
# Desarrollo con hot-reload
npm run start:dev

# Desarrollo con debug
npm run start:debug

# Build de producción
npm run build

# Ejecutar build
npm run start:prod
```

### **🧪 Testing**
```bash
# Tests unitarios (80 tests)
npm run test

# Tests unitarios específicos
npm run test:unit

# Tests de integración y E2E (33 tests)
npm run test:e2e

# Tests de integración específicos
npm run test:integration

# Todos los tests (113 tests total)
npm run test:all

# Coverage completo
npm run test:cov
npm run test:all:cov
```

### **🎨 Calidad de Código**
```bash
# Linting con corrección automática
npm run lint

# Formateo de código
npm run format
```

### **🐳 Docker**
```bash
# Levantar servicios
docker compose up

# Levantar con rebuild
docker compose up --build

# Solo base de datos
docker compose up db

# Logs de servicios
docker compose logs api
docker compose logs db

# Detener servicios
docker compose down
```

---

## 📊 **API ENDPOINTS**

### **🔍 Búsqueda de Productos**
```http
GET /api/products/search?q={query}
```

#### **Parámetros**
| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `q` | string | ✅ Sí | Término de búsqueda (1-255 caracteres) |

#### **Lógica de Búsqueda**
1. **🎯 Título exacto** (case-insensitive) → 1 producto
2. **🔍 Marca/Descripción** (si query > 3 caracteres) → N productos
3. **📏 Query corto** (≤ 3 caracteres sin match exacto) → 0 productos

#### **Detección de Palíndromos**
- ✅ Normalización automática (minúsculas, sin acentos, solo alfanuméricos)
- ✅ Descuento del **50%** aplicado automáticamente
- ✅ Ejemplos: `abba`, `radar`, `level`, `A man a plan a canal Panama`

### **📤 Respuestas**

#### **✅ Búsqueda Exitosa con Palíndromo (200)**
```json
{
  "query": "abba",
  "isPalindrome": true,
  "items": [{
    "id": 107,
    "title": "abba",
    "brand": "Test Brand",
    "description": "Test product for palindrome testing",
    "originalPrice": 500.00,
    "finalPrice": 250.00,
    "discountPercentage": 50
  }],
  "totalItems": 1
}
```

#### **✅ Búsqueda Exitosa Sin Palíndromo (200)**
```json
{
  "query": "laptop",
  "isPalindrome": false,
  "items": [{
    "id": 15,
    "title": "Gaming Laptop",
    "brand": "TechCorp",
    "description": "High-performance gaming laptop",
    "originalPrice": 1200.00,
    "finalPrice": 1200.00
  }],
  "totalItems": 1
}
```

#### **❌ Error de Validación (400)**
```json
{
  "message": "El parámetro de búsqueda \"q\" es requerido",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🧪 **TESTING STRATEGY**

### **📈 Métricas de Testing**
- **🔢 Total Tests**: 113 casos de prueba
- **🎯 Unit Tests**: 80 tests (servicios y utilidades)
- **🔗 Integration Tests**: 12 tests (base de datos)
- **🌐 E2E Tests**: 21 tests (API completa)
- **📊 Coverage**: >90% en componentes críticos

### **🧩 Tipos de Tests**
| Categoría | Cantidad | Enfoque |
|-----------|----------|---------|
| **PalindromeService** | 15 tests | Detección y normalización |
| **ProductsService** | 20 tests | Consultas de base de datos |
| **SearchService** | 25 tests | Lógica de negocio |
| **SearchController** | 20 tests | API endpoints |
| **Integration Tests** | 12 tests | Base de datos real |
| **E2E Tests** | 21 tests | Flujo completo |

### **🎯 Casos de Prueba Destacados**
- ✅ Palíndromos con acentos: `"Anita lava la tina"`
- ✅ Búsquedas case-insensitive: `"ABBA"` vs `"abba"`
- ✅ Queries cortos vs largos: `"ab"` vs `"laptop"`
- ✅ Cálculos exactos de descuentos
- ✅ Manejo de errores HTTP
- ✅ Performance < 500ms por request

---

## 🗄️ **BASE DE DATOS**

### **📋 Esquema de Datos**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### **🌱 Datos de Prueba**
El sistema incluye **auto-seeding** con +100 productos incluyendo:

#### **🎯 Productos con Palíndromos** (descuento automático)
- `abba` - Test product for palindrome testing ($500.00 → $250.00)
- `level` - Professional spirit level tool ($1010.00 → $505.00)
- `radar` - High quality radar equipment ($1170.00 → $585.00)
- `civic` - Compact city car ($2200.00 → $1100.00)
- `kayak` - Professional kayak for water sports ($1850.00 → $925.00)

#### **🛍️ Productos Regulares** (sin descuento)
- Laptops, phones, watches, cameras, headphones
- Marcas: TechCorp, Sports Elite, Audio Pro, Camera World
- Categorías: tecnología, deportes, hogar, oficina

---

## ⚙️ **CONFIGURACIÓN**

### **🔧 Variables de Entorno**
```bash
# .env.dev (desarrollo)
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@db:5432/store
AUTO_SEED=true

# .env.test (testing)
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/store
AUTO_SEED=false
```

### **🎛️ Configuración Avanzada**
- **Factory Pattern**: Configuración tipada con `registerAs()`
- **Validación Joi**: Schema de validación para todas las variables
- **Multi-entorno**: Archivos específicos por `NODE_ENV`
- **Auto-seeding**: Condicional por variable `AUTO_SEED`

> **⚠️ NOTA IMPORTANTE**: Los archivos `.env.dev` y `.env.test` están incluidos en el repositorio **únicamente para fines prácticos de esta prueba técnica**, para facilitar la evaluación y ejecución inmediata del proyecto. En un entorno de producción real, estos archivos contendrían información sensible y **NUNCA** deberían estar versionados en git.

---

## 📚 **DOCUMENTACIÓN TÉCNICA**

Este proyecto incluye documentación técnica detallada creada mediante **estrategias de metaprompting** con **ChatGPT-5 Thinking** para la destructuración de requerimientos y **Claude Sonnet 4** como agente de implementación:

### **📖 Documentación Disponible**

#### **🏗️ [architecture.md](./prompts/architecture.md)**
- **Decisiones arquitectónicas** fundamentadas y justificadas
- **Patrones de diseño** implementados (Factory, DI, Module, DTO)
- **Lógica de negocio** detallada (búsqueda por prioridad, descuentos)
- **Esquema de base de datos** y reglas de validación
- **Criterios de aceptación** y definición de hecho (DoD)

#### **⚙️ [implementation.md](./prompts/implementation.md)**
- **Plan paso a paso** de implementación por fases
- **Decisiones técnicas** con justificaciones completas
- **Estado de implementación** actual y pendientes
- **Guía para agentes IA** (prompts estructurados para Claude Sonnet 4)
- **Configuración Docker** y setup de desarrollo

#### **🧪 [tests-planning.md](./prompts/tests-planning.md)**
- **Estrategia de testing** completa (Unit, Integration, E2E)
- **Plan detallado** de 113 casos de prueba implementados
- **Arquitectura de mocks** y fixtures de testing
- **Métricas de calidad** y coverage targets (>90%)
- **Cronograma de implementación** y entregables

#### **🖥️ [front.md](./prompts/front.md)**
- **Especificación técnica** para integración frontend
- **Contratos de API** con tipos TypeScript
- **Ejemplos de respuestas** y manejo de errores
- **Datos de prueba** para desarrollo frontend

---

## 👥 **DESARROLLO Y COLABORACIÓN**

### **🤖 Metodología de Desarrollo**
Este proyecto fue desarrollado utilizando una metodología innovadora de **AI-Driven Development**:

1. **📋 Análisis de Requerimientos**: Destructuración con ChatGPT-5 Thinking
2. **🏗️ Diseño Arquitectónico**: Decisiones fundamentadas con metaprompting
3. **⚙️ Implementación Asistida**: Claude Sonnet 4 como agente de desarrollo
4. **🧪 Testing Exhaustivo**: 113 casos de prueba generados sistemáticamente
5. **📚 Documentación Completa**: Auto-generada y mantenida en sincronía

### **👨‍💻 Autor Principal**
**Arnold Esquivel** - Ingeniero de Software
- Arquitectura y diseño del sistema
- Metodología de metaprompting
- Supervisión de implementación

### **🤖 Agente de Implementación**
**Claude Sonnet 4** - Asistente de IA
- Implementación de código base
- Generación de tests exhaustivos
- Documentación técnica detallada

---

## 🚦 **ESTADO DEL PROYECTO**

### **✅ Completado**
- ✅ **Core Architecture**: Factory pattern con configuración tipada
- ✅ **Database Layer**: TypeORM con auto-seeding (+100 productos)
- ✅ **Business Logic**: PalindromeService con normalización avanzada
- ✅ **API Layer**: SearchController con validación robusta
- ✅ **Testing Suite**: 113 tests con >90% coverage
- ✅ **Docker Setup**: Multi-stage con health checks
- ✅ **Documentation**: Arquitectura, implementación y testing

### **🎯 Funcionalidades Principales**
- ✅ Búsqueda por título exacto (case-insensitive)
- ✅ Búsqueda por marca/descripción (query > 3 caracteres)
- ✅ Detección de palíndromos con normalización completa
- ✅ Descuentos automáticos del 50% para palíndromos
- ✅ Respuestas enriquecidas (originalPrice, finalPrice, discount)
- ✅ Manejo completo de errores HTTP
- ✅ Auto-seeding condicional para evaluación fácil

---

## 🔬 **EJEMPLOS DE USO**

### **🎯 Testing Manual**
```bash
# Levantar el proyecto
docker compose up --build

# Probar palíndromo con descuento
curl "http://localhost:3000/api/products/search?q=abba"
# Respuesta: 50% descuento aplicado

# Probar búsqueda normal
curl "http://localhost:3000/api/products/search?q=laptop"
# Respuesta: sin descuento

# Probar búsqueda por marca
curl "http://localhost:3000/api/products/search?q=sports"
# Respuesta: productos con "sports" en brand/description

# Probar case-insensitive
curl "http://localhost:3000/api/products/search?q=RADAR"
# Respuesta: encuentra "radar" con descuento palindrómico

# Probar error de validación
curl "http://localhost:3000/api/products/search"
# Respuesta: 400 Bad Request
```

### **🎪 Palíndromos de Prueba**
- `abba` → 50% descuento
- `radar` → 50% descuento  
- `level` → 50% descuento
- `A man a plan a canal Panama` → 50% descuento
- `Anita lava la tina` → 50% descuento

---

## 📜 **LICENCIA**

Este proyecto es **UNLICENSED** y fue desarrollado como parte del **Reto Palíndromo** para **Acueducto**.

---

## 🤝 **CONTRIBUCIÓN**

Para dudas técnicas o contribuciones, revisar la documentación técnica en `/prompts/` que contiene todos los detalles de arquitectura, implementación y testing.

**🎯 Este proyecto representa una implementación completa y production-ready del Reto Palíndromo, desarrollada con metodologías avanzadas de AI-Driven Development y documentación exhaustiva.**
