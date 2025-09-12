import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExpenseSplit, PaymentRequest } from '../types';

interface UseExpenseSplitsProps {
  request: PaymentRequest;
  initialSplits?: ExpenseSplit[];
  isSplitMode?: boolean; // New prop for split mode
}

interface UseExpenseSplitsReturn {
  splits: Omit<ExpenseSplit, 'id' | 'requestId'>[];
  setSplits: React.Dispatch<React.SetStateAction<Omit<ExpenseSplit, 'id' | 'requestId'>[]>>;
  totalSplit: number;
  isBalanced: boolean;
  addSplit: () => void;
  removeSplit: (index: number) => void;
  updateSplit: (index: number, field: keyof Omit<ExpenseSplit, 'id' | 'requestId'>, value: any) => void;
  validationErrors: string[];
  validationWarnings: string[];
  isFormValid: boolean;
}

export function useExpenseSplits({ 
  request, 
  initialSplits,
  isSplitMode = false
}: UseExpenseSplitsProps): UseExpenseSplitsReturn {
  const [splits, setSplits] = useState<Omit<ExpenseSplit, 'id' | 'requestId'>[]>(() => {
    if (initialSplits && initialSplits.length > 0) {
      return initialSplits.map(split => ({
        expenseItemId: split.expenseItemId,
        amount: split.amount,
        comment: split.comment,
        contractId: split.contractId,
        priority: split.priority
      }));
    }
    return [{ expenseItemId: '', amount: request.amount || 0, comment: '' }];
  });

  const totalSplit = useMemo(() => {
    return splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  }, [splits]);

  const isBalanced = useMemo(() => {
    return Math.abs(totalSplit - request.amount) < 0.01;
  }, [totalSplit, request.amount]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Check if all splits have expense items assigned
    const unassignedSplits = splits.filter(split => !split.expenseItemId);
    if (unassignedSplits.length > 0) {
      errors.push(`${unassignedSplits.length} статей не имеют назначенного расходного элемента`);
    }

    // Check if all splits have sub-registrars assigned (if subRegistrarId field exists)
    const unassignedSubRegistrars = splits.filter(split => 'subRegistrarId' in split && !split.subRegistrarId);
    if (unassignedSubRegistrars.length > 0) {
      errors.push(`Необходимо выбрать суб-регистратора для ${unassignedSubRegistrars.length} позиций`);
    }

    // Check if total amount matches request amount
    if (!isBalanced) {
      errors.push(`Сумма ${isSplitMode ? 'разделения' : 'распределения'} (${totalSplit.toLocaleString()}) не равна сумме документа (${request.amount.toLocaleString()})`);
    }

    // Check if all splits have amounts
    const emptyAmountSplits = splits.filter(split => !split.amount || split.amount <= 0);
    if (emptyAmountSplits.length > 0) {
      errors.push(`${emptyAmountSplits.length} статей не имеют указанной суммы`);
    }

    // Split mode specific validation
    if (isSplitMode && splits.length < 2) {
      errors.push('Для разделения заявки необходимо минимум 2 статьи расходов');
    }

    return errors;
  }, [splits, isBalanced, totalSplit, request.amount, isSplitMode]);

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];

    // Check if all splits have expense items assigned
    const unassignedSplits = splits.filter(split => !split.expenseItemId);
    if (unassignedSplits.length > 0) {
      warnings.push(`Необходимо выбрать статью расходов для ${unassignedSplits.length} позиций`);
    }

    // Check if all splits have sub-registrars assigned (if subRegistrarId field exists)
    const unassignedSubRegistrars = splits.filter(split => 'subRegistrarId' in split && !split.subRegistrarId);
    if (unassignedSubRegistrars.length > 0) {
      warnings.push(`Необходимо выбрать суб-регистратора для ${unassignedSubRegistrars.length} позиций`);
    }

    // Check if total amount matches request amount
    if (!isBalanced) {
      warnings.push(`Сумма ${isSplitMode ? 'разделения' : 'распределения'} (${totalSplit.toLocaleString()}) не равна сумме заявки (${request.amount.toLocaleString()})`);
    }

    // Split mode specific warnings
    if (isSplitMode && splits.length < 2) {
      warnings.push('Для разделения заявки необходимо минимум 2 статьи расходов');
    }

    return warnings;
  }, [splits, isBalanced, totalSplit, request.amount, isSplitMode]);

  const isFormValid = useMemo(() => {
    return validationErrors.length === 0;
  }, [validationErrors]);

  const addSplit = useCallback(() => {
    setSplits(prev => [...prev, { expenseItemId: '', amount: 0, comment: '' }]);
  }, []);

  const removeSplit = useCallback((index: number) => {
    setSplits(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const updateSplit = useCallback((index: number, field: keyof Omit<ExpenseSplit, 'id' | 'requestId'>, value: any) => {
    setSplits(prev => {
      const newSplits = [...prev];
      newSplits[index] = { ...newSplits[index], [field]: value };
      return newSplits;
    });
  }, []);

  return {
    splits,
    setSplits,
    totalSplit,
    isBalanced,
    addSplit,
    removeSplit,
    updateSplit,
    validationErrors,
    validationWarnings,
    isFormValid
  };
}
