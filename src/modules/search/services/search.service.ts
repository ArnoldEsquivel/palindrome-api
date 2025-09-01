import { Injectable } from '@nestjs/common';

import { SearchResponseDto, ProductItemDto } from '../dto/search-response.dto';
import { ProductsService } from '../../products/services/products.service';
import { PalindromeService } from '../../../utils/palindrome.service'
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class SearchService {
  constructor(
    private productsService: ProductsService,
    private palindromeService: PalindromeService,
  ) {}

  async search(query: string): Promise<SearchResponseDto> {
    const trimmedQuery = (query || '').trim();
    
    // Si no hay query, devolver todos los productos
    if (!trimmedQuery) {
      const allProducts = await this.productsService.findAll({ limit: 100, offset: 0 });
      const items = allProducts.products.map(product => this.mapProductToItem(product, false));
      
      return {
        query: '',
        isPalindrome: false,
        items,
        totalItems: items.length,
      };
    }
    
    const isPalindrome = this.palindromeService.isPalindrome(trimmedQuery);
    
    // Búsqueda unificada en todos los campos (title, brand, description)
    const products = await this.productsService.searchAcrossAllFields(trimmedQuery);

    // Mapea productos aplicando descuento si la query es palíndromo
    const items = products.map(product => this.mapProductToItem(product, isPalindrome));

    return {
      query: trimmedQuery,
      isPalindrome,
      items,
      totalItems: items.length,
    };
  }

  private mapProductToItem(product: Product, isPalindrome: boolean): ProductItemDto {
    const originalPrice = Number(product.price);
    
    if (isPalindrome) {
      const discountPercentage = 50;
      const finalPrice = Math.round(originalPrice * 0.5 * 100) / 100; // Redondeo a 2 decimales
      
      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        description: product.description,
        originalPrice,
        finalPrice,
        discountPercentage,
      };
    } else {
      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        description: product.description,
        originalPrice,
        finalPrice: originalPrice,
      };
    }
  }
}
