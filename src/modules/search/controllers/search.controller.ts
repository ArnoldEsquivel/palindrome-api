import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';

import { SearchResponseDto } from '../dto/search-response.dto';
import { SearchService } from '../services/search.service';
import { SearchQueryDto } from '../dto/search-query.dto';

@Controller('api/products')
export class SearchController {
  constructor(private searchService: SearchService) { }

  @Get('search')
  async search(@Query() queryParams: any): Promise<SearchResponseDto> {
    // Hacer el parámetro de búsqueda opcional
    const searchTerm = queryParams.q || queryParams.searchTerm || '';

    // Crear DTO para validación adicional si es necesario
    const searchDto = new SearchQueryDto();
    searchDto.searchTerm = searchTerm;

    try {
      return await this.searchService.search(searchDto.searchTerm);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error interno en la búsqueda',
          error: 'Internal Server Error',
          statusCode: 500,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
