import { Product } from '../entities/product.entity';

export interface ProductsResponse {
  products: Product[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}
