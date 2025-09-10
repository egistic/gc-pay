import React from 'react';
import { Button } from '../../ui/button';
import { Send, ArrowLeft } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  onReturn?: () => void;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  submitText?: string;
  returnText?: string;
  className?: string;
}

export function FormActions({
  onCancel,
  onSubmit,
  onReturn,
  isSubmitting = false,
  isSubmitDisabled = false,
  submitText = 'Отправить распорядителю',
  returnText = 'Вернуть исполнителю',
  className = ''
}: FormActionsProps) {
  return (
    <div className={`flex flex-col md:flex-row gap-4 justify-end ${className}`}>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        К списку
      </Button>
      
      {onReturn && (
        <Button variant="outline" onClick={onReturn}>
          {returnText}
        </Button>
      )}
      
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || isSubmitDisabled}
      >
        <Send className="h-4 w-4 mr-2" />
        {submitText}
      </Button>
    </div>
  );
}
