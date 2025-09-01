import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ProductsResponse, PaginationQuery } from '../interfaces';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ): Promise<ProductsResponse> {
    // Validación manual de parámetros
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Validar que sean números válidos
    if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
      throw new Error('Los parámetros limit y offset deben ser números positivos');
    }

    const paginationOptions = { limit, offset };

    const result = await this.productsService.findAll(paginationOptions);
    
    const totalPages = Math.ceil(result.totalItems / paginationOptions.limit);
    const currentPage = Math.floor(paginationOptions.offset / paginationOptions.limit) + 1;

    return {
      products: result.products,
      totalItems: result.totalItems,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }
}
