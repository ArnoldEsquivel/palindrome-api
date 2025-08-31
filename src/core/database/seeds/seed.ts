import { DataSource } from 'typeorm';

import { Product } from '../../../modules/products/entities/product.entity';
import { seedProducts } from './products.seeds';

export async function runSeed(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product);
  
  // Limpiar datos existentes
  await productRepository.clear();
  
  // Insertar seeds
  for (const productData of seedProducts) {
    const product = productRepository.create(productData);
    await productRepository.save(product);
  }

  console.log('Seeds inserted successfully, now you can try to find some palindromes to get a discount!');
}
