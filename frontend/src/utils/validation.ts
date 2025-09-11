import { PaymentRequest, ExpenseSplit } from '../types';

/**
 * Represents a validation error with field and message
 */
export interface ValidationError {
  /** The field that has the validation error */
  field: string;
  /** The error message to display */
  message: string;
}

/**
 * Represents the result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
}

/**
 * Validate payment request data for required fields and data integrity
 * 
 * @param request - Partial payment request object to validate
 * @returns Validation result with errors if any
 * 
 * @example
 * ```tsx
 * const result = validatePaymentRequest({
 *   counterpartyId: '123',
 *   amount: 1000,
 *   currency: 'KZT'
 * });
 * if (!result.isValid) {
 *   console.log(result.errors);
 * }
 * ```
 */
export const validatePaymentRequest = (request: Partial<PaymentRequest>): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!request.counterpartyId) {
    errors.push({ field: 'counterpartyId', message: 'Контрагент обязателен' });
  }

  if (!request.amount || request.amount <= 0) {
    errors.push({ field: 'amount', message: 'Сумма должна быть больше 0' });
  }

  if (!request.currency) {
    errors.push({ field: 'currency', message: 'Валюта обязательна' });
  }

  if (!request.dueDate) {
    errors.push({ field: 'dueDate', message: 'Срок исполнения обязателен' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate expense splits
 */
export const validateExpenseSplits = (splits: Omit<ExpenseSplit, 'id' | 'requestId'>[], totalAmount: number): ValidationResult => {
  const errors: ValidationError[] = [];

  if (splits.length === 0) {
    errors.push({ field: 'splits', message: 'Необходимо добавить хотя бы одну статью расходов' });
    return { isValid: false, errors };
  }

  // Check if all splits have expense items
  const unassignedSplits = splits.filter(split => !split.expenseItemId);
  if (unassignedSplits.length > 0) {
    errors.push({ field: 'splits', message: `Необходимо выбрать статью расходов для ${unassignedSplits.length} позиций` });
  }

  // Check if all splits have amounts
  const emptyAmountSplits = splits.filter(split => !split.amount || split.amount <= 0);
  if (emptyAmountSplits.length > 0) {
    errors.push({ field: 'splits', message: `Необходимо указать сумму для ${emptyAmountSplits.length} позиций` });
  }

  // Check if total amount matches
  const totalSplitAmount = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
    errors.push({ 
      field: 'splits', 
      message: `Сумма распределения (${totalSplitAmount.toLocaleString()}) не равна сумме заявки (${totalAmount.toLocaleString()})` 
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate sub-registrar assignment
 */
export const validateSubRegistrarAssignment = (splits: Omit<ExpenseSplit, 'id' | 'requestId'>[]): ValidationResult => {
  const errors: ValidationError[] = [];

  const unassignedSubRegistrars = splits.filter(split => 'subRegistrarId' in split && !split.subRegistrarId);
  if (unassignedSubRegistrars.length > 0) {
    errors.push({ 
      field: 'subRegistrarId', 
      message: `Необходимо выбрать суб-регистратора для ${unassignedSubRegistrars.length} позиций` 
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string[] => {
  return errors.map(error => error.message);
};

/**
 * Get field-specific validation error
 */
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  const error = errors.find(e => e.field === field);
  return error?.message;
};
