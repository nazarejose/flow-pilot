import { BadRequestException } from '@nestjs/common';

export type FieldSchemaInput = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
};

const VALID_TYPES = ['text', 'textarea', 'select', 'number', 'date', 'checkbox'];

function validateField(field: FieldSchemaInput, index: number): void {
  if (!field.name || typeof field.name !== 'string' || field.name.trim() === '') {
    throw new BadRequestException(`Field at index ${index} has invalid or missing 'name'`);
  }

  if (!field.type || !VALID_TYPES.includes(field.type)) {
    throw new BadRequestException(`Field '${field.name}' has invalid type '${field.type}'. Valid types: ${VALID_TYPES.join(', ')}`);
  }

  if (!field.label || typeof field.label !== 'string' || field.label.trim() === '') {
    throw new BadRequestException(`Field '${field.name}' has invalid or missing 'label'`);
  }

  if (typeof field.required !== 'boolean') {
    throw new BadRequestException(`Field '${field.name}' must have a boolean 'required' property`);
  }

  if (field.type === 'select') {
    if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
      throw new BadRequestException(`Select field '${field.name}' must have at least one option`);
    }
  }
}

export function validateHelpdeskSchema(schema: readonly FieldSchemaInput[] | FieldSchemaInput[]): void {
  if (!schema || !Array.isArray(schema) || schema.length === 0) {
    throw new BadRequestException('Schema must have at least one field');
  }

  const seenNames = new Set<string>();

  for (let i = 0; i < schema.length; i++) {
    validateField(schema[i], i);

    const fieldName = schema[i].name;
    if (seenNames.has(fieldName)) {
      throw new BadRequestException(`Duplicate field name in schema: '${fieldName}'`);
    }
    seenNames.add(fieldName);
  }
}
