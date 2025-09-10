import { 
  ValidationResult, 
  ValidationError, 
  DictionaryItem,
  ExpenseItemDictionary,
  CounterpartyDictionary,
  ContractDictionary,
  NormativeDictionary,
  PriorityDictionary,
  UserDictionary
} from '../../types/dictionaries';
import { UserRole, CounterpartyCategory } from '../../types';

/**
 * Base validator interface
 */
export interface Validator<T extends DictionaryItem> {
  validate(item: T): ValidationResult;
  validateField(field: keyof T, value: any): ValidationError[];
}

/**
 * Base validator implementation
 */
export abstract class BaseValidator<T extends DictionaryItem> implements Validator<T> {
  abstract validate(item: T): ValidationResult;
  abstract validateField(field: keyof T, value: any): ValidationError[];

  protected createError(field: string, message: string, code: string): ValidationError {
    return { field, message, code };
  }

  protected validateRequired(value: any, field: string): ValidationError[] {
    if (value === null || value === undefined || value === '') {
      return [this.createError(field, `${field} is required`, 'REQUIRED')];
    }
    return [];
  }

  protected validateString(value: any, field: string, minLength?: number, maxLength?: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'string') {
      errors.push(this.createError(field, `${field} must be a string`, 'INVALID_TYPE'));
      return errors;
    }

    if (minLength && value.length < minLength) {
      errors.push(this.createError(field, `${field} must be at least ${minLength} characters`, 'MIN_LENGTH'));
    }

    if (maxLength && value.length > maxLength) {
      errors.push(this.createError(field, `${field} must be no more than ${maxLength} characters`, 'MAX_LENGTH'));
    }

    return errors;
  }

  protected validateEmail(value: any, field: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'string') {
      errors.push(this.createError(field, `${field} must be a string`, 'INVALID_TYPE'));
      return errors;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push(this.createError(field, `${field} must be a valid email address`, 'INVALID_EMAIL'));
    }

    return errors;
  }

  protected validateNumber(value: any, field: string, min?: number, max?: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(this.createError(field, `${field} must be a number`, 'INVALID_TYPE'));
      return errors;
    }

    if (min !== undefined && value < min) {
      errors.push(this.createError(field, `${field} must be at least ${min}`, 'MIN_VALUE'));
    }

    if (max !== undefined && value > max) {
      errors.push(this.createError(field, `${field} must be no more than ${max}`, 'MAX_VALUE'));
    }

    return errors;
  }

  protected validateEnum(value: any, field: string, allowedValues: string[]): ValidationError[] {
    if (!allowedValues.includes(value)) {
      return [this.createError(field, `${field} must be one of: ${allowedValues.join(', ')}`, 'INVALID_ENUM')];
    }
    return [];
  }
}

/**
 * Expense Item Validator
 */
export class ExpenseItemValidator extends BaseValidator<ExpenseItemDictionary> {
  validate(item: ExpenseItemDictionary): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    errors.push(...this.validateRequired(item.name, 'name'));
    errors.push(...this.validateRequired(item.code, 'code'));
    errors.push(...this.validateRequired(item.ownerRole, 'ownerRole'));

    // String validations
    errors.push(...this.validateString(item.name, 'name', 1, 255));
    errors.push(...this.validateString(item.code, 'code', 3, 10));

    // Code format validation
    if (item.code && !/^\d{3}$/.test(item.code)) {
      errors.push(this.createError('code', 'Code must be 3 digits', 'INVALID_FORMAT'));
    }

    // Owner role validation
    const validRoles: UserRole[] = ['executor', 'registrar', 'distributor', 'treasurer', 'admin'];
    errors.push(...this.validateEnum(item.ownerRole, 'ownerRole', validRoles));

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(field: keyof ExpenseItemDictionary, value: any): ValidationError[] {
    switch (field) {
      case 'name':
        return this.validateString(value, 'name', 1, 255);
      case 'code':
        if (typeof value === 'string' && !/^\d{3}$/.test(value)) {
          return [this.createError('code', 'Code must be 3 digits', 'INVALID_FORMAT')];
        }
        return this.validateString(value, 'code', 3, 10);
      case 'ownerRole':
        const validRoles: UserRole[] = ['executor', 'registrar', 'distributor', 'treasurer', 'admin'];
        return this.validateEnum(value, 'ownerRole', validRoles);
      default:
        return [];
    }
  }
}

/**
 * Counterparty Validator
 */
export class CounterpartyValidator extends BaseValidator<CounterpartyDictionary> {
  validate(item: CounterpartyDictionary): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    errors.push(...this.validateRequired(item.name, 'name'));
    errors.push(...this.validateRequired(item.abbreviation, 'abbreviation'));
    errors.push(...this.validateRequired(item.binIin, 'binIin'));
    errors.push(...this.validateRequired(item.email, 'email'));
    errors.push(...this.validateRequired(item.category, 'category'));

    // String validations
    errors.push(...this.validateString(item.name, 'name', 1, 255));
    errors.push(...this.validateString(item.abbreviation, 'abbreviation', 1, 50));
    errors.push(...this.validateString(item.binIin, 'binIin', 12, 12));

    // Email validation
    errors.push(...this.validateEmail(item.email, 'email'));

    // BIN/IIN validation
    if (item.binIin && !/^\d{12}$/.test(item.binIin)) {
      errors.push(this.createError('binIin', 'BIN/IIN must be 12 digits', 'INVALID_FORMAT'));
    }

    // Category validation
    const validCategories: CounterpartyCategory[] = [
      'Поставщик СХ',
      'Элеватор',
      'Поставщик Услуг',
      'Покупатель',
      'Партнер/БВУ'
    ];
    errors.push(...this.validateEnum(item.category, 'category', validCategories));

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(field: keyof CounterpartyDictionary, value: any): ValidationError[] {
    switch (field) {
      case 'name':
        return this.validateString(value, 'name', 1, 255);
      case 'email':
        return this.validateEmail(value, 'email');
      case 'binIin':
        if (typeof value === 'string' && !/^\d{12}$/.test(value)) {
          return [this.createError('binIin', 'BIN/IIN must be 12 digits', 'INVALID_FORMAT')];
        }
        return this.validateString(value, 'binIin', 12, 12);
      case 'category':
        const validCategories: CounterpartyCategory[] = [
          'Поставщик СХ',
          'Элеватор',
          'Поставщик Услуг',
          'Покупатель',
          'Партнер/БВУ'
        ];
        return this.validateEnum(value, 'category', validCategories);
      default:
        return [];
    }
  }
}

/**
 * Contract Validator
 */
export class ContractValidator extends BaseValidator<ContractDictionary> {
  validate(item: ContractDictionary): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    errors.push(...this.validateRequired(item.counterpartyId, 'counterpartyId'));
    errors.push(...this.validateRequired(item.expenseItemId, 'expenseItemId'));
    errors.push(...this.validateRequired(item.startDate, 'startDate'));
    errors.push(...this.validateRequired(item.endDate, 'endDate'));
    errors.push(...this.validateRequired(item.limitTotal, 'limitTotal'));

    // Number validations
    errors.push(...this.validateNumber(item.limitTotal, 'limitTotal', 0));
    errors.push(...this.validateNumber(item.usedTotal, 'usedTotal', 0));

    // Date validations
    if (item.startDate && item.endDate) {
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate);
      
      if (startDate >= endDate) {
        errors.push(this.createError('endDate', 'End date must be after start date', 'INVALID_DATE_RANGE'));
      }
    }

    // Status validation
    const validStatuses = ['active', 'completed', 'cancelled'];
    errors.push(...this.validateEnum(item.status, 'status', validStatuses));

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(field: keyof ContractDictionary, value: any): ValidationError[] {
    switch (field) {
      case 'limitTotal':
      case 'usedTotal':
        return this.validateNumber(value, field, 0);
      case 'status':
        const validStatuses = ['active', 'completed', 'cancelled'];
        return this.validateEnum(value, 'status', validStatuses);
      default:
        return [];
    }
  }
}

/**
 * Priority Validator
 */
export class PriorityValidator extends BaseValidator<PriorityDictionary> {
  validate(item: PriorityDictionary): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    errors.push(...this.validateRequired(item.name, 'name'));
    errors.push(...this.validateRequired(item.rank, 'rank'));
    errors.push(...this.validateRequired(item.color, 'color'));

    // String validations
    errors.push(...this.validateString(item.name, 'name', 1, 100));
    errors.push(...this.validateString(item.color, 'color', 1, 50));

    // Number validations
    errors.push(...this.validateNumber(item.rank, 'rank', 1, 10));

    // Color validation (basic hex color check)
    if (item.color && !/^#[0-9A-Fa-f]{6}$/.test(item.color)) {
      errors.push(this.createError('color', 'Color must be a valid hex color', 'INVALID_COLOR'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(field: keyof PriorityDictionary, value: any): ValidationError[] {
    switch (field) {
      case 'name':
        return this.validateString(value, 'name', 1, 100);
      case 'rank':
        return this.validateNumber(value, 'rank', 1, 10);
      case 'color':
        if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return [this.createError('color', 'Color must be a valid hex color', 'INVALID_COLOR')];
        }
        return this.validateString(value, 'color', 1, 50);
      default:
        return [];
    }
  }
}

/**
 * User Validator
 */
export class UserValidator extends BaseValidator<UserDictionary> {
  validate(item: UserDictionary): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    errors.push(...this.validateRequired(item.name, 'name'));
    errors.push(...this.validateRequired(item.email, 'email'));
    errors.push(...this.validateRequired(item.roles, 'roles'));
    errors.push(...this.validateRequired(item.currentRole, 'currentRole'));

    // String validations
    errors.push(...this.validateString(item.name, 'name', 1, 255));
    errors.push(...this.validateString(item.email, 'email', 1, 255));

    // Email validation
    errors.push(...this.validateEmail(item.email, 'email'));

    // Roles validation
    if (Array.isArray(item.roles) && item.roles.length === 0) {
      errors.push(this.createError('roles', 'At least one role is required', 'REQUIRED'));
    }

    // Current role validation
    const validRoles: UserRole[] = ['executor', 'registrar', 'distributor', 'treasurer', 'admin'];
    errors.push(...this.validateEnum(item.currentRole, 'currentRole', validRoles));

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(field: keyof UserDictionary, value: any): ValidationError[] {
    switch (field) {
      case 'name':
        return this.validateString(value, 'name', 1, 255);
      case 'email':
        return this.validateEmail(value, 'email');
      case 'currentRole':
        const validRoles: UserRole[] = ['executor', 'registrar', 'distributor', 'treasurer', 'admin'];
        return this.validateEnum(value, 'currentRole', validRoles);
      default:
        return [];
    }
  }
}

/**
 * Validation Manager
 */
export class ValidationManager {
  private validators: Map<string, Validator<any>> = new Map();

  constructor() {
    this.registerValidator('expense-articles', new ExpenseItemValidator());
    this.registerValidator('counterparties', new CounterpartyValidator());
    this.registerValidator('contracts', new ContractValidator());
    this.registerValidator('priorities', new PriorityValidator());
    this.registerValidator('users', new UserValidator());
  }

  registerValidator<T extends DictionaryItem>(type: string, validator: Validator<T>): void {
    this.validators.set(type, validator);
  }

  validate<T extends DictionaryItem>(type: string, item: T): ValidationResult {
    const validator = this.validators.get(type);
    if (!validator) {
      return {
        isValid: false,
        errors: [{ field: 'type', message: `No validator found for type: ${type}`, code: 'NO_VALIDATOR' }]
      };
    }

    return validator.validate(item);
  }

  validateField<T extends DictionaryItem>(type: string, field: keyof T, value: any): ValidationError[] {
    const validator = this.validators.get(type);
    if (!validator) {
      return [{ field: 'type', message: `No validator found for type: ${type}`, code: 'NO_VALIDATOR' }];
    }

    return validator.validateField(field, value);
  }
}
