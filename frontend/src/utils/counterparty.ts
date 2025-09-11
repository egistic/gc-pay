import { Counterparty } from '../types';

/**
 * Get the name of a counterparty by its ID
 * 
 * @param counterparties - Array of counterparty objects
 * @param id - The counterparty ID to search for
 * @returns The counterparty name or 'Неизвестен' if not found
 * 
 * @example
 * ```tsx
 * const name = getCounterpartyName(counterparties, '123');
 * // Returns: "ООО Рога и Копыта" or "Неизвестен"
 * ```
 */
export const getCounterpartyName = (counterparties: Counterparty[], id: string): string => {
  return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
};

/**
 * Get counterparty by ID from a list of counterparties
 * @param counterparties - Array of counterparties
 * @param id - Counterparty ID
 * @returns Counterparty object or undefined if not found
 */
export const getCounterpartyById = (counterparties: Counterparty[], id: string): Counterparty | undefined => {
  return counterparties.find(cp => cp.id === id);
};

