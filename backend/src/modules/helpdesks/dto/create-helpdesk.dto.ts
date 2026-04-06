import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FieldSchemaDto } from './field-schema.dto';

export class CreateHelpdeskDto {
  @IsNotEmpty()
  @IsUUID()
  sectorId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldSchemaDto)
  schema: FieldSchemaDto[];
}