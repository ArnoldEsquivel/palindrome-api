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
