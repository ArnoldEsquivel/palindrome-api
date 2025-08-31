import { IsString, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchQueryDto {
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El término de búsqueda es requerido' })
  @Length(1, 255, { message: 'El término de búsqueda debe tener entre 1 y 255 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  searchTerm: string;
}
