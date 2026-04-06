import { BadRequestException } from '@nestjs/common';
import { validateHelpdeskSchema, FieldSchemaInput } from './helpdesk-schema.validator';

const makeField = (overrides: Partial<FieldSchemaInput> = {}): FieldSchemaInput => ({
  name: 'test_field',
  type: 'text',
  label: 'Test Field',
  required: false,
  ...overrides,
});

describe('validateHelpdeskSchema', () => {
  describe('empty schema', () => {
    it('should throw BadRequestException for empty schema', () => {
      expect(() => validateHelpdeskSchema([])).toThrow(BadRequestException);
      expect(() => validateHelpdeskSchema([])).toThrow('Schema must have at least one field');
    });

    it('should throw BadRequestException for undefined schema', () => {
      expect(() => validateHelpdeskSchema(undefined as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for null schema', () => {
      expect(() => validateHelpdeskSchema(null as any)).toThrow(BadRequestException);
    });
  });

  describe('structural validation', () => {
    it('should accept a valid schema with multiple fields', () => {
      const schema: FieldSchemaInput[] = [
        makeField({ name: 'category', type: 'select', label: 'Category', required: true, options: ['Hardware', 'Software'] }),
        makeField({ name: 'description', type: 'textarea', label: 'Description', required: true }),
        makeField({ name: 'priority', type: 'number', label: 'Priority', required: false }),
        makeField({ name: 'due_date', type: 'date', label: 'Due Date', required: false }),
        makeField({ name: 'urgent', type: 'checkbox', label: 'Urgent', required: false }),
      ];

      expect(() => validateHelpdeskSchema(schema)).not.toThrow();
    });

    it('should throw if field name is empty', () => {
      expect(() => validateHelpdeskSchema([makeField({ name: '' })])).toThrow(BadRequestException);
      expect(() => validateHelpdeskSchema([makeField({ name: '' })])).toThrow('name');
    });

    it('should throw if field name is missing', () => {
      expect(() => validateHelpdeskSchema([{ type: 'text', label: 'X', required: false }] as any)).toThrow(BadRequestException);
    });

    it('should throw if field type is missing', () => {
      expect(() => validateHelpdeskSchema([makeField({ type: '' })])).toThrow(BadRequestException);
    });

    it('should throw if field type is invalid', () => {
      expect(() => validateHelpdeskSchema([makeField({ type: 'unknown' as any })])).toThrow(BadRequestException);
    });

    it('should throw if field label is missing', () => {
      expect(() => validateHelpdeskSchema([makeField({ label: '' })])).toThrow(BadRequestException);
    });

    it('should throw if required is not boolean', () => {
      expect(() => validateHelpdeskSchema([{ name: 'x', type: 'text', label: 'X', required: 'yes' }] as any)).toThrow(BadRequestException);
    });

    it('should throw if required is missing', () => {
      expect(() => validateHelpdeskSchema([{ name: 'x', type: 'text', label: 'X' }] as any)).toThrow(BadRequestException);
    });
  });

  describe('select type options', () => {
    it('should throw if select field has no options', () => {
      expect(() => validateHelpdeskSchema([makeField({ name: 'type', type: 'select', label: 'Type', required: true })])).toThrow(BadRequestException);
      expect(() => validateHelpdeskSchema([makeField({ type: 'select', label: 'Type', required: true }) as any])).toThrow(BadRequestException);
    });

    it('should throw if select field has empty options', () => {
      expect(() => validateHelpdeskSchema([
        makeField({ name: 'type', type: 'select', label: 'Type', required: true, options: [] }),
      ])).toThrow(BadRequestException);
    });

    it('should accept non-select fields without options', () => {
      expect(() => validateHelpdeskSchema([makeField({ name: 'desc', type: 'textarea', label: 'Description', required: true })])).not.toThrow();
      expect(() => validateHelpdeskSchema([makeField({ name: 'count', type: 'number', label: 'Count', required: false })])).not.toThrow();
      expect(() => validateHelpdeskSchema([makeField({ name: 'date', type: 'date', label: 'Date', required: false })])).not.toThrow();
      expect(() => validateHelpdeskSchema([makeField({ name: 'flag', type: 'checkbox', label: 'Flag', required: false })])).not.toThrow();
      expect(() => validateHelpdeskSchema([makeField({ name: 'note', type: 'text', label: 'Note', required: false })])).not.toThrow();
    });

    it('should accept non-select fields with options (optional metadata)', () => {
      expect(() => validateHelpdeskSchema([makeField({ name: 'desc', type: 'textarea', label: 'Description', required: true, options: ['short', 'long'] })])).not.toThrow();
    });
  });

  describe('uniqueness validation', () => {
    it('should throw if schema has duplicate field names', () => {
      const schema: FieldSchemaInput[] = [
        makeField({ name: 'category', type: 'text', label: 'Cat 1', required: true }),
        makeField({ name: 'category', type: 'select', label: 'Cat 2', required: true, options: ['A', 'B'] }),
      ];

      expect(() => validateHelpdeskSchema(schema)).toThrow(BadRequestException);
      expect(() => validateHelpdeskSchema(schema)).toThrow('category');
    });

    it('should accept schema with unique field names', () => {
      const schema: FieldSchemaInput[] = [
        makeField({ name: 'category', type: 'text', label: 'Cat', required: true }),
        makeField({ name: 'priority', type: 'number', label: 'Priority', required: false }),
        makeField({ name: 'status', type: 'select', label: 'Status', required: false, options: ['open', 'closed'] }),
      ];

      expect(() => validateHelpdeskSchema(schema)).not.toThrow();
    });
  });
});
