// Utility functions extracted from mockData.ts
// These functions are still needed by the application

/**
 * Generate a unique request number
 */
export function generateRequestNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REQ-${timestamp}-${random}`;
}

/**
 * Generate a unique payment request ID
 */
export function generatePaymentRequestId(): string {
  return `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique contract ID
 */
export function generateContractId(): string {
  return `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique counterparty ID
 */
export function generateCounterpartyId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique expense item ID
 */
export function generateExpenseItemId(): string {
  return `ei_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique priority ID
 */
export function generatePriorityId(): string {
  return `priority_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique normative ID
 */
export function generateNormativeId(): string {
  return `normative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
