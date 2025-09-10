import { useState, useEffect, useMemo } from 'react';
import { ExpenseSplit, PaymentRequest } from '../types';

interface UseExpenseSplitsProps {
  request: PaymentRequest;
  initialSplits?: ExpenseSplit[];
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
}

export function useExpenseSplits({ 
  request, 
  initialSplits 
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
    return [{ expenseItemId: '', amount: request.amount, comment: '' }];
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

    // Check if total amount matches request amount
    if (!isBalanced) {
      errors.push(`Сумма распределения (${totalSplit.toLocaleString()}) не равна сумме документа (${request.amount.toLocaleString()})`);
    }

    // Check if all splits have amounts
    const emptyAmountSplits = splits.filter(split => !split.amount || split.amount <= 0);
    if (emptyAmountSplits.length > 0) {
      errors.push(`${emptyAmountSplits.length} статей не имеют указанной суммы`);
    }

    return errors;
  }, [splits, isBalanced, totalSplit, request.amount]);

  const addSplit = () => {
    setSplits([...splits, { expenseItemId: '', amount: 0, comment: '' }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateSplit = (index: number, field: keyof Omit<ExpenseSplit, 'id' | 'requestId'>, value: any) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  return {
    splits,
    setSplits,
    totalSplit,
    isBalanced,
    addSplit,
    removeSplit,
    updateSplit,
    validationErrors
  };
}
