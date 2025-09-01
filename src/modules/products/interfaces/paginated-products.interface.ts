import { Product } from '../entities/product.entity';

export interface PaginatedProducts {
  products: Product[];
  totalItems: number;
}
