import { BadRequestException } from '@nestjs/common';

export type FieldSchema = {
  name: string;
  required: boolean;
};

export function validateFieldValues(
  fieldValues: Record<string, unknown>,
  schema: FieldSchema[],
): Record<string, unknown> {
  if (!fieldValues || typeof fieldValues !== 'object') {
    throw new BadRequestException('fieldValues must be a valid object');
  }

  const requiredFields = schema.filter((f) => f.required);

  for (const field of requiredFields) {
    if (fieldValues[field.name] === undefined || fieldValues[field.name] === null) {
      throw new BadRequestException(`Missing required field: '${field.name}'`);
    }
  }

  const schemaFields = new Set(schema.map((f) => f.name));
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fieldValues)) {
    if (schemaFields.has(key)) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
