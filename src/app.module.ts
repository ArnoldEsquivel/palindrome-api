import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { DatabaseModule } from './core/database/database.module';
import { validationSchema } from './core/config/config.schema';
import { environments } from './core/config/environments';
import config from './core/config/config.factory';

import { ProductsModule } from './modules/products/products.module';
import { SearchModule } from './modules/search/search.module';

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
  controllers: [],
  providers: [],
})
export class AppModule {}
