/**
 * Validates input data against a schema, supporting Mongoose schema rules and nested objects/arrays.
 * @param {Object} newData - The new input data to validate.
 * @param {Object} [oldData={}] - The old data for comparison (optional).
 * @param {Object} schema - The schema defining validation rules (based on Mongoose schema structure).
 * @returns {Object} - Validation result with properties:
 *   - isValid {boolean}: Whether the input is valid.
 *   - errors {Object}: Object containing validation error messages.
 *   - changes {Object}: Object containing changed fields.
 *   - hasChanges {boolean}: Whether there are any changes.
 * @throws {Error} - If schema is invalid or not an object.
 * @example
 * const schema = {
 *   username: { type: 'string', required: true, minLength: 3, maxLength: 50 },
 *   email: { type: 'string', required: true, lowercase: true, validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) }
 * };
 * const result = validateInputWithSchema({ username: 'john', email: 'john@example.com' }, {}, schema);
 */
import mongoose from "mongoose";
/**
 * Convert Mongoose schema to validation rules.
 * @param {mongoose.Schema} mongooseSchema
 * @returns {Object} - Validation rules object
 */
export function mongooseSchemaToValidatorRules(mongooseSchema) {
  const rules = {};
  for (const [key, field] of Object.entries(mongooseSchema.paths)) {
    const rule = {};
    if (field.isRequired) rule.required = true;
    if (field.instance) rule.type = field.instance.toLowerCase();
    if (field.options.minLength) rule.minLength = field.options.minLength;
    if (field.options.maxLength) rule.maxLength = field.options.maxLength;
    if (field.options.enum) rule.enum = field.options.enum.values;
    if (field.options.min) rule.min = field.options.min;
    if (field.options.max) rule.max = field.options.max;
    if (field.options.trim) rule.trim = true;
    if (field.options.lowercase) rule.lowercase = true;
    if (field.options.ref) rule.type = 'objectid';
    if (field.schema) rule.schema = mongooseSchemaToValidatorRules(field.schema);
    rules[key] = rule;
  }
  return rules;
}
export const standardValidators = {
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Invalid email format',
  url: (val) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+[/#?]?.*$/.test(val) || 'Invalid URL',
};

export function validateInputWithSchema(newData = {}, oldData = {}, schema = {}) {
  // Input validation
  if (!isObject(newData) || !isObject(oldData) || !isObject(schema)) {
    throw new Error('newData, oldData, and schema must be objects');
  }

  const errors = {};
  const changes = {};
  let isValid = true;

  // Helper to check if value is an object (but not an array or null)
  function isObject(val) {
    return val && typeof val === 'object' && !Array.isArray(val);
  }

  // Helper for deep comparison of values
  function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => deepEqual(item, b[i]));
    }
    if (isObject(a) && isObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => deepEqual(a[key], b[key]));
    }
    return false;
  }

  // Recursive validation function
  function validateField(key, newValue, oldValue, rules, prefix = '') {
    const fieldErrors = [];

    // Check required
    if (rules.required && (newValue === undefined || newValue === null || newValue === '')) {
      fieldErrors.push(`${prefix}${key} is required`);
    }

    // Skip further checks if no new value
    if (newValue === undefined) {
      if (fieldErrors.length) {
        errors[prefix + key] = fieldErrors;
        isValid = false;
      }
      return;
    }

    // Check type
    if (rules.type) {
      const expectedType = rules.type.toLowerCase();
      if (expectedType === 'objectid' && !mongoose.isValidObjectId(newValue)) {
        fieldErrors.push(`${prefix}${key} must be a valid ObjectId`);
      } else if (expectedType === 'array' && !Array.isArray(newValue)) {
        fieldErrors.push(`${prefix}${key} must be an array`);
      } else if (expectedType !== 'array' && expectedType !== 'objectid' && typeof newValue !== expectedType) {
        fieldErrors.push(`${prefix}${key} must be a ${expectedType}`);
      }
    }

    // String-specific checks
    if (typeof newValue === 'string') {
      let processedValue = newValue;
      if (rules.trim) processedValue = processedValue.trim();
      if (rules.lowercase) processedValue = processedValue.toLowerCase();

      if (rules.minLength && processedValue.length < rules.minLength) {
        fieldErrors.push(`${prefix}${key} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && processedValue.length > rules.maxLength) {
        fieldErrors.push(`${prefix}${key} must be at most ${rules.maxLength} characters`);
      }
      if (rules.enum && !rules.enum.includes(processedValue)) {
        fieldErrors.push(`${prefix}${key} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    // Number-specific checks
    if (typeof newValue === 'number') {
      if (rules.min !== undefined && newValue < rules.min) {
        fieldErrors.push(`${prefix}${key} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && newValue > rules.max) {
        fieldErrors.push(`${prefix}${key} must be at most ${rules.max}`);
      }
    }

    // Array-specific checks
    if (Array.isArray(newValue) && rules.items) {
      newValue.forEach((item, index) => {
        validateField(`${key}[${index}]`, item, oldValue?.[index], rules.items, `${prefix}${key}.`);
      });
    }

    // Nested object checks
    if (isObject(newValue) && rules.schema) {
      for (const subKey in rules.schema) {
        validateField(subKey, newValue[subKey], oldValue?.[subKey], rules.schema[subKey], `${prefix}${key}.`);
      }
    }

    // Custom validator
    if (rules.validate && typeof rules.validate === 'function') {
      try {
        const result = rules.validate(newValue);
        if (result !== true) {
          const message = typeof result === 'string' ? result : `${prefix}${key} is invalid`;
          fieldErrors.push(message);
        }
      } catch (error) {
        fieldErrors.push(`${prefix}${key} validation failed: ${error.message}`);
      }
    }

    // Record errors
    if (fieldErrors.length) {
      errors[prefix + key] = fieldErrors;
      isValid = false;
    }

    // Check for changes
    if (!deepEqual(newValue, oldValue)) {
      changes[prefix + key] = newValue;
    }
  }

  // Iterate through schema
  for (const key in schema) {
    validateField(key, newData[key], oldData[key], schema[key]);
  }

  return {
    isValid,
    errors,
    changes,
    hasChanges: Object.keys(changes).length > 0,
  };
}
