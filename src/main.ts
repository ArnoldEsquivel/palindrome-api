import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { AppModule } from './app.module';
import config from './core/config/config.factory';
import { runSeed } from './core/database/seeds/seed';
import { Product } from './modules/products/entities/product.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Obtener configuración usando el factory pattern
  const configService = app.get<ConfigType<typeof config>>(config.KEY);
  
  // Habilitar CORS si está configurado
  const corsOrigin = configService.server.corsOrigin;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
    });
  }
  
  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // Auto-seeding si está habilitado
  if (configService.app.autoSeed) {
    try {
      const dataSource = new DataSource({
        type: 'postgres',
        url: configService.database.url,
        entities: [Product],
        synchronize: true,
      });
      
      await dataSource.initialize();
      console.log('🌱 Ejecutando auto-seeding...');
      await runSeed(dataSource);
      console.log('✅ Auto-seeding completado');
      await dataSource.destroy();
    } catch (error) {
      console.error('❌ Error en auto-seeding:', error);
      // No fallar el bootstrap por errores de seeding
    }
  }
  
  // Obtener puerto
  const port = configService.server.port;
  
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📋 API endpoint: http://localhost:${port}/api/products/search?q=abba`);
}

bootstrap();
