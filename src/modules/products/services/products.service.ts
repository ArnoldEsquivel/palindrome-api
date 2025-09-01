import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import { PaginationOptions, PaginatedProducts } from '../interfaces';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Obtiene todos los productos con paginación opcional
   */
  async findAll(options: PaginationOptions): Promise<PaginatedProducts> {
    const { limit, offset } = options;

    const [products, totalItems] = await this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.id', 'ASC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return {
      products,
      totalItems,
    };
  }

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

  /**
   * Busca productos en todos los campos (title, brand, description)
   * Búsqueda unificada que encuentra coincidencias parciales en cualquier campo
   */
  async searchAcrossAllFields(query: string): Promise<Product[]> {
    if (!query?.trim()) return [];

    const searchPattern = `%${query.trim()}%`;
    
    return this.productRepository
      .createQueryBuilder('product')
      .where(
        'product.title ILIKE :pattern OR ' +
        'product.brand ILIKE :pattern OR ' + 
        'product.description ILIKE :pattern',
        { pattern: searchPattern }
      )
      .orderBy('product.id', 'ASC')
      .getMany();
  }
}
