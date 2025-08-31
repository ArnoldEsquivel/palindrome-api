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
    
    // Validación básica (class-validator maneja lo principal)
    if (!trimmedQuery) {
      return {
        query: '',
        isPalindrome: false,
        items: [],
        totalItems: 0,
      };
    }
    
    const isPalindrome = this.palindromeService.isPalindrome(trimmedQuery);
    
    let products: Product[] = [];

    // 1. Intentar búsqueda por título exacto (prevalece)
    const exactProduct = await this.productsService.findByExactTitle(trimmedQuery);
    if (exactProduct) {
      products = [exactProduct];
    } else if (trimmedQuery.length > 3) {
      // 2. Si no hay match exacto y query > 3, buscar en brand/description
      products = await this.productsService.searchByBrandOrDescriptionContains(trimmedQuery);
    }
    // 3. Si query <= 3 y no hay match exacto, products queda como []

    // Mapea productos aplicando descuento si es palíndromo
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
