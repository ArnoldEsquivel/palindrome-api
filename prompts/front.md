# 📚 **DOCUMENTACIÓN TÉCNICA - PALINDROME API**
## *Especificación para integración Frontend*

---

## 📋 **INFORMACIÓN GENERAL**

### 🔧 **Configuración del Servidor**
- **Base URL**: `http://localhost:3000`
- **Puerto por defecto**: `3000`
- **CORS habilitado**: `http://localhost:3001` (configurable)
- **Protocolo**: HTTP/HTTPS
- **Formato de respuesta**: JSON

### 🚀 **Inicialización**
```bash
# Levantar el servidor
docker compose up --build
# Servidor disponible en: http://localhost:3000
# Auto-seeding incluido con +100 productos de prueba
```

---

## 🛤️ **ENDPOINTS DISPONIBLES**

### **GET** `/api/products/search`
**Búsqueda de productos con detección de palíndromos y descuentos automáticos**

#### **Parámetros de Query**
| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `q` | `string` | ✅ **Sí** | Término de búsqueda (1-255 caracteres) |
| `searchTerm` | `string` | ❌ No | Alternativa a `q` (menor prioridad) |

**Nota**: El parámetro `q` tiene prioridad sobre `searchTerm` si ambos están presentes.

---

## 🔍 **LÓGICA DE BÚSQUEDA**

### **Algoritmo de Prioridad**
1. **🎯 Búsqueda por título exacto** (case-insensitive)
   - Si encuentra coincidencia exacta → retorna 1 producto
   - Prevalece sobre cualquier otra búsqueda

2. **🔍 Búsqueda por contenido** (solo si query > 3 caracteres)
   - Busca en `brand` y `description`
   - Retorna todos los productos que contengan el término
   - Case-insensitive con `ILIKE`

3. **📏 Queries cortas** (≤ 3 caracteres)
   - Sin título exacto → retorna array vacío
   - Con título exacto → retorna el producto encontrado

### **Detección de Palíndromos**
- **Normalización**: Convierte a minúsculas, remueve diacríticos y caracteres especiales
- **Ejemplos de palíndromos válidos**: `abba`, `radar`, `level`, `A man a plan a canal Panama`
- **Descuento automático**: 50% en `finalPrice` si el query es palíndromo

---

## 📤 **TIPOS DE DATOS**

### **SearchResponse (Respuesta Principal)**
```typescript
interface SearchResponse {
  query: string;           // Query original del usuario
  isPalindrome: boolean;   // true si query es palíndromo
  items: ProductItem[];    // Array de productos encontrados
  totalItems: number;      // Cantidad total de items
}
```

### **ProductItem (Producto Individual)**
```typescript
interface ProductItem {
  id: number;                    // ID único del producto
  title: string;                 // Título del producto
  brand: string;                 // Marca del producto
  description: string;           // Descripción del producto
  originalPrice: number;         // Precio original (sin descuento)
  finalPrice: number;            // Precio final (con descuento si aplica)
  discountPercentage?: number;   // % de descuento (solo si isPalindrome=true)
}
```

### **ApiError (Respuesta de Error)**
```typescript
interface ApiError {
  message: string;         // Mensaje descriptivo del error
  error: string;          // Tipo de error (ej: "Bad Request")
  statusCode: number;     // Código HTTP del error
}
```

---

## 🎯 **EJEMPLOS DE RESPUESTAS**

### **1. Búsqueda con Palíndromo (50% descuento)**
**Request**: `GET /api/products/search?q=abba`
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

### **2. Búsqueda Normal (sin descuento)**
**Request**: `GET /api/products/search?q=laptop`
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
    // Note: Sin discountPercentage cuando no hay descuento
  }],
  "totalItems": 1
}
```

### **3. Sin Resultados**
**Request**: `GET /api/products/search?q=xyz`
```json
{
  "query": "xyz",
  "isPalindrome": false,
  "items": [],
  "totalItems": 0
}
```

---

## ❌ **RESPUESTAS DE ERROR**

### **400 Bad Request - Parámetro Faltante**
```http
GET /api/products/search
```

```json
{
  "message": "El parámetro de búsqueda \"q\" es requerido",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **400 Bad Request - Query Vacía**
```http
GET /api/products/search?q=
```

```json
{
  "message": "El parámetro de búsqueda \"q\" es requerido",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **500 Internal Server Error**
```json
{
  "message": "Error interno en la búsqueda",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

---

## ❌ **RESPUESTAS DE ERROR**

### **400 Bad Request**
**Request**: `GET /api/products/search` (sin parámetros)
```json
{
  "message": "El parámetro de búsqueda \"q\" es requerido",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Request**: `GET /api/products/search?q=` (query vacía)
```json
{
  "message": "El parámetro de búsqueda \"q\" es requerido",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **500 Internal Server Error**
```json
{
  "message": "Error interno en la búsqueda",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

---

## 🔧 **CONSIDERACIONES TÉCNICAS**

### **Caracteres Especiales**
- Usar `encodeURIComponent()` para el query parameter
- La API maneja automáticamente espacios y caracteres especiales
- Los acentos son normalizados para detección de palíndromos

### **Validaciones**
- Query mínimo: 1 carácter (no vacío)
- Query máximo: 255 caracteres
- Queries ≤ 3 caracteres solo buscan título exacto

### **Performance**
- Búsquedas típicas: < 500ms
- Sin cache implementado (implementar en frontend si es necesario)
- Considerar debouncing para búsquedas en tiempo real

---

## 🚀 **DATOS DE PRUEBA**

### **Productos con Palíndromos** (50% descuento automático)
- `abba` - Test product for palindrome testing
- `level` - Professional spirit level tool  
- `radar` - High quality radar equipment
- `civic` - Compact city car
- `kayak` - Professional kayak for water sports

### **Búsquedas por Contenido** (marca/descripción)
- `sports` - Productos deportivos
- `tech` - Productos tecnológicos  
- `gaming` - Productos gaming
- `professional` - Productos profesionales

---

**🎯 Esta especificación contiene toda la información técnica necesaria para integrar con la Palindrome API desde el frontend Next.js.**
