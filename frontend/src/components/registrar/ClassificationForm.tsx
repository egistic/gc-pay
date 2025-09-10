import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentRequest, ExpenseSplit } from '../../types';
import { useDictionaries } from '../../hooks/useDictionaries';
import { RequestInformationCard } from '../common/RequestInformationCard';
import { ExpenseSplitForm } from './shared/ExpenseSplitForm';
import { FormActions } from './shared/FormActions';

interface ClassificationFormProps {
  request: PaymentRequest;
  onSubmit: (splits: ExpenseSplit[], comment?: string) => void;
  onReturn: (comment: string) => void;
  onCancel: () => void;
}

export function ClassificationForm({ request, onSubmit, onReturn, onCancel }: ClassificationFormProps) {
  // Get dictionary data
  const { items: expenseItems } = useDictionaries('expense-articles');
  const { items: counterparties } = useDictionaries('counterparties');
  
  const [splits, setSplits] = useState<Omit<ExpenseSplit, 'id' | 'requestId'>[]>([]);
  const [returnComment, setReturnComment] = useState('');
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const handleSplitsChange = useCallback((splits: Omit<ExpenseSplit, 'id' | 'requestId'>[]) => {
    setSplits(splits);
  }, []);

  const handleSubmit = () => {
    if (splits.length === 0) {
      return;
    }

    const validSplits = splits.filter(split => split.expenseItemId && split.amount > 0);
    if (validSplits.length === 0) {
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    const validSplits = splits.filter(split => split.expenseItemId && split.amount > 0);
    const expenseSplits: ExpenseSplit[] = validSplits.map((split, index) => ({
      id: `split_${Date.now()}_${index}`,
      requestId: request.id,
      ...split
    }));

    onSubmit(expenseSplits);
    setShowConfirmDialog(false);
  };

  const handleReturn = () => {
    if (returnComment.trim()) {
      onReturn(returnComment);
      setShowReturnDialog(false);
    }
  };

  const handleViewDocument = () => {
    // In real app, this would open the document
    toast.info('Открытие документа: ' + request.fileName);
  };

  const handleDownloadDocument = () => {
    // In real app, this would download the document
    toast.info('Скачивание документа: ' + request.fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          К списку
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Классификация заявки</h2>
          <p className="text-muted-foreground">
            {request.requestNumber ? `Заявка: ${request.requestNumber}` : `Документ: ${request.docNumber}`}
          </p>
        </div>
      </div>

      {/* Request Information */}
      <RequestInformationCard
        request={request}
        getCounterpartyName={getCounterpartyName}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        showDocumentActions={true}
      />

      <Separator />

      {/* Expense Split Form */}
      <ExpenseSplitForm
        request={request}
        expenseItems={expenseItems}
        onSplitsChange={handleSplitsChange}
        showValidation={true}
      />

      {/* Actions */}
      <FormActions
        onCancel={onCancel}
        onSubmit={handleSubmit}
        onReturn={() => setShowReturnDialog(true)}
        isSubmitDisabled={splits.length === 0 || splits.some(s => !s.expenseItemId || !s.amount)}
        submitText="Отправить распорядителю"
        returnText="Вернуть исполнителю"
      />

      {/* Return dialog */}
      {showReturnDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Возврат заявки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Причина возврата *</Label>
                <Textarea
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  placeholder="Укажите причину возврата заявки исполнителю"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleReturn}
                  disabled={!returnComment.trim()}
                  variant="destructive"
                >
                  Вернуть
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Подтверждение отправки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Если Вы подтверждаете корректность заполненной информации, заявка будет отправлена Распорядителю
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Отмена
                </Button>
                <Button onClick={handleConfirmSubmit}>
                  Подтвердить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
