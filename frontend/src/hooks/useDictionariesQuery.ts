import { useQuery } from '@tanstack/react-query';
import { DictionaryService } from '../services/dictionaries/dictionaryService';
import { DictionaryItem } from '../types';

// Query keys for dictionaries
export const dictionaryKeys = {
  all: ['dictionaries'] as const,
  lists: () => [...dictionaryKeys.all, 'list'] as const,
  list: (type: string) => [...dictionaryKeys.lists(), type] as const,
};

// Hook for fetching dictionary items
export const useDictionaryItems = (type: string) => {
  return useQuery({
    queryKey: dictionaryKeys.list(type),
    queryFn: () => DictionaryService.getItems(type),
    staleTime: 10 * 60 * 1000, // 10 minutes - dictionaries change rarely
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for fetching counterparties
export const useCounterparties = () => {
  return useDictionaryItems('counterparties');
};

// Hook for fetching expense items
export const useExpenseItems = () => {
  return useDictionaryItems('expense-articles');
};

// Hook for fetching VAT rates
export const useVatRates = () => {
  return useDictionaryItems('vat-rates');
};

// Hook for fetching currencies
export const useCurrencies = () => {
  return useDictionaryItems('currencies');
};
