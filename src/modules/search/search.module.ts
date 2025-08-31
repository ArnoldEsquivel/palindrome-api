import { Module } from '@nestjs/common';

import { SearchController } from './controllers/search.controller';
import { PalindromeService } from '../../utils/palindrome.service';
import { ProductsModule } from '../products/products.module';
import { SearchService } from './services/search.service';

@Module({
  imports: [ProductsModule],
  controllers: [SearchController],
  providers: [SearchService, PalindromeService]
})
export class SearchModule {}
