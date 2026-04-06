import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class FieldSchemaDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(['text', 'textarea', 'select', 'number', 'date', 'checkbox'])
  type: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsArray()
  @ValidateIf((o: FieldSchemaDto) => o.type === 'select')
  options?: string[];
}