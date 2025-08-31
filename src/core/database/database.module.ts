import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { Product } from '../../modules/products/entities/product.entity';
import config from '../config/config.factory';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [config.KEY],
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
