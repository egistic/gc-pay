import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import { 
  Check, 
  ChevronsUpDown, 
  Plus, 
  Trash2, 
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../ui/utils';
import { ExpenseItem, PaymentRequest, ExpenseSplit } from '../../../types';
import { useExpenseSplits } from '../../../hooks/useExpenseSplits';
import { ValidationAlert } from './ValidationAlert';
import { formatCurrency, formatNumber } from '../../../utils/formatting';

interface ExpenseSplitFormProps {
  request: PaymentRequest;
  expenseItems: ExpenseItem[];
  onSplitsChange: (splits: Omit<ExpenseSplit, 'id' | 'requestId'>[]) => void;
  initialSplits?: ExpenseSplit[];
  showValidation?: boolean;
  className?: string;
}

export function ExpenseSplitForm({
  request,
  expenseItems,
  onSplitsChange,
  initialSplits,
  showValidation = true,
  className = ''
}: ExpenseSplitFormProps) {
  const {
    splits,
    totalSplit,
    isBalanced,
    addSplit,
    removeSplit,
    updateSplit,
    validationErrors
  } = useExpenseSplits({ request, initialSplits });

  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // Notify parent of changes
  useEffect(() => {
    onSplitsChange(splits);
  }, [splits, onSplitsChange]);

  const getExpenseItemName = (id: string): string => {
    const item = expenseItems.find(item => item.id === id);
    return item ? item.name : 'Не выбрано';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Распределение по статьям расходов
            <Badge variant={isBalanced ? "default" : "destructive"}>
              Сумма: {formatCurrency(totalSplit, request.currency)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showValidation && !isBalanced && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Сумма распределения ({formatCurrency(totalSplit, request.currency)}) 
                не равна сумме документа ({formatCurrency(request.amount, request.currency)})
              </AlertDescription>
            </Alert>
          )}

          {splits.map((split, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Позиция {index + 1}</h4>
                {splits.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSplit(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Статья расходов *</Label>
                  <Popover open={openPopoverIndex === index} onOpenChange={(open) => {
                    setOpenPopoverIndex(open ? index : null);
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {getExpenseItemName(split.expenseItemId)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Поиск статьи расходов..." />
                        <CommandList>
                          <CommandEmpty>Статья не найдена.</CommandEmpty>
                          <CommandGroup>
                            {expenseItems.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={(value) => {
                                  updateSplit(index, 'expenseItemId', value);
                                  setOpenPopoverIndex(null);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    split.expenseItemId === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{item.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Сумма *</Label>
                  <Input
                    type="number"
                    value={split.amount || ''}
                    onChange={(e) => updateSplit(index, 'amount', Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Комментарий</Label>
                <Textarea
                  value={split.comment || ''}
                  onChange={(e) => updateSplit(index, 'comment', e.target.value)}
                  placeholder="Дополнительная информация по данной статье"
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addSplit} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Добавить статью расходов
          </Button>
        </CardContent>
      </Card>

      {showValidation && validationErrors.length > 0 && (
        <ValidationAlert errors={validationErrors} />
      )}
    </div>
  );
}
