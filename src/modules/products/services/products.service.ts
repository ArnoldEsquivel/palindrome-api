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
