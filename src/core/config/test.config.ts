import { registerAs } from '@nestjs/config';

export default registerAs('testConfig', () => ({
  server: {
    port: parseInt(process.env.TEST_PORT, 10) || 3001,
    corsOrigin: '*',
  },
  database: {
    // Usar la misma base de datos PostgreSQL que ya está corriendo en Docker
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/products_db',
  },
  app: {
    autoSeed: false, // No queremos auto-seed en tests, lo controlamos manualmente
  },
}));
