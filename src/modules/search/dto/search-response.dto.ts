export class ProductItemDto {
  id: number;
  title: string;
  brand: string;
  description: string;
  originalPrice: number;
  finalPrice: number;
  discountPercentage?: number; // Solo presente si hay descuento
}

export class SearchResponseDto {
  query: string;
  isPalindrome: boolean;
  items: ProductItemDto[];
  totalItems: number;
}
