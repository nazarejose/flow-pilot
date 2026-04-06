import { BadRequestException } from '@nestjs/common';
import { validateFieldValues, FieldSchema } from './ticket-field-values.validator';

const mockSchema: FieldSchema[] = [
  { name: 'category', required: true },
  { name: 'description', required: true },
  { name: 'priority', required: false },
];

describe('validateFieldValues', () => {
  it('should return cleaned fieldValues with valid data', () => {
    const fieldValues = { category: 'Hardware', description: 'Broken keyboard', priority: 'high' };

    const result = validateFieldValues(fieldValues, mockSchema);

    expect(result).toEqual(fieldValues);
  });

  it('should strip extra fields not in schema', () => {
    const fieldValues = { category: 'Hardware', description: 'Broken', extra: 'should be removed' };

    const result = validateFieldValues(fieldValues, mockSchema);

    expect(result).toEqual({ category: 'Hardware', description: 'Broken' });
    expect(result).not.toHaveProperty('extra');
  });

  it('should throw BadRequestException if required field is missing', () => {
    const fieldValues = { category: 'Hardware' }; // missing 'description'

    expect(() => validateFieldValues(fieldValues, mockSchema)).toThrow(BadRequestException);
    expect(() => validateFieldValues(fieldValues, mockSchema)).toThrow("Missing required field: 'description'");
  });

  it('should throw BadRequestException if required field is null', () => {
    const fieldValues = { category: 'Hardware', description: null };

    expect(() => validateFieldValues(fieldValues, mockSchema)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if fieldValues is not an object', () => {
    expect(() => validateFieldValues(null as any, mockSchema)).toThrow(BadRequestException);
    expect(() => validateFieldValues('string' as any, mockSchema)).toThrow(BadRequestException);
  });

  it('should allow missing optional fields', () => {
    const fieldValues = { category: 'Software', description: 'Crash on login' };

    const result = validateFieldValues(fieldValues, mockSchema);

    expect(result).toEqual({ category: 'Software', description: 'Crash on login' });
  });

  it('should handle empty schema (no fields)', () => {
    const result = validateFieldValues({ any: 'value' }, []);

    expect(result).toEqual({});
  });
});
