import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft,
  Save,
  Upload,
  FileText,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { PaymentRequest } from '../../types';
import { RequestInformationCard } from '../common/RequestInformationCard';
import { SimpleFileUpload } from '../common/SimpleFileUpload';
import { useDictionaries } from '../../hooks/useDictionaries';
import { formatCurrency } from '../../utils/formatting';
import { toast } from 'sonner';

interface SubRegistrarRequestViewProps {
  request: PaymentRequest;
  onBack: () => void;
  onSave: (data: ClosingDocumentData) => void;
}

interface ClosingDocumentData {
  documentType: string;
  documentNumber: string;
  documentDate: string;
  amountWithoutVat: number;
  vatAmount: number;
  currency: string;
  files: Array<{id: string, name: string, url: string, originalName: string}>;
  originalDocumentsStatus: string;
  comment?: string;
}

const DOCUMENT_TYPES = [
  { value: 'АВР', label: 'АВР' },
  { value: 'Другое', label: 'Другое' },
  { value: 'Инвойс', label: 'Инвойс' },
  { value: 'УПД', label: 'УПД' },
  { value: 'ЭСФ', label: 'ЭСФ' },
  { value: 'АО', label: 'АО' }
];

const ORIGINAL_DOCUMENT_STATUSES = [
  { value: 'not_received', label: 'Не получены' },
  { value: 'fully_received', label: 'Получены в полном объеме' },
  { value: 'partially_received', label: 'Частично получены' }
];

export function SubRegistrarRequestView({ request, onBack, onSave }: SubRegistrarRequestViewProps) {
  const { items: counterparties, state: counterpartiesState } = useDictionaries('counterparties');
  const { items: expenseItems, state: expenseItemsState } = useDictionaries('expense-articles');
  
  const [closingDocumentData, setClosingDocumentData] = useState<ClosingDocumentData>({
    documentType: '',
    documentNumber: '',
    documentDate: '',
    amountWithoutVat: 0,
    vatAmount: 0,
    currency: request.currency,
    files: [],
    originalDocumentsStatus: 'not_received',
    comment: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Load existing closing document data if available
  useEffect(() => {
    // TODO: Load existing closing document data from API
    // For now, initialize with empty data
  }, [request.id]);

  // Validate form
  useEffect(() => {
    const valid = 
      closingDocumentData.documentType !== '' &&
      closingDocumentData.documentNumber !== '' &&
      closingDocumentData.documentDate !== '' &&
      closingDocumentData.amountWithoutVat > 0 &&
      closingDocumentData.originalDocumentsStatus !== '';
    
    setIsValid(valid);
  }, [closingDocumentData]);

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестен';
  };

  const getCounterpartyCategory = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.category || 'Не указано';
  };

  const getVatRate = (vatRateId: string | undefined) => {
    return vatRateId || 'Не указано';
  };

  const handleInputChange = (field: keyof ClosingDocumentData, value: any) => {
    setClosingDocumentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles = files.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      originalName: file.name
    }));

    setClosingDocumentData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles]
    }));
  };

  const handleFileRemove = (fileId: string) => {
    setClosingDocumentData(prev => ({
      ...prev,
      files: prev.files.filter(file => file.id !== fileId)
    }));
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(closingDocumentData);
      toast.success('Данные закрывающих документов сохранены');
    } catch (error) {
      console.error('Error saving closing document data:', error);
      toast.error('Ошибка при сохранении данных');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'classified':
        return <Badge className="bg-blue-100 text-blue-800">Классифицирована</Badge>;
      case 'allocated':
        return <Badge className="bg-green-100 text-green-800">Распределена</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800">Возвращена</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'classified':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'allocated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'returned':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (counterpartiesState.isLoading || expenseItemsState.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Заявка {request.requestNumber}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(request.status)}
              {getStatusBadge(request.status)}
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!isValid || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      {/* Request Information Card */}
      <RequestInformationCard
        request={request}
        getCounterpartyName={getCounterpartyName}
        getCounterpartyCategory={getCounterpartyCategory}
        getVatRate={getVatRate}
        onViewDocument={() => {
          if (request.docFileUrl) {
            window.open(request.docFileUrl, '_blank');
          } else {
            toast.info(`Просмотр документа: ${request.fileName}`);
          }
        }}
        onDownloadDocument={() => {
          toast.info(`Скачивание документа: ${request.fileName}`);
        }}
        showDocumentActions={true}
      />

      {/* Registrar Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Информация от Регистратора
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Ответственный регистратор</Label>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Айгуль Нурланова</span>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Дата классификации</Label>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>15.01.2024 14:30</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closing Document Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Закрывающие документы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Type and Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-type" className="mb-2 block">Тип закрывающего документа *</Label>
              <Select
                value={closingDocumentData.documentType}
                onValueChange={(value) => handleInputChange('documentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип документа" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="document-number" className="mb-2 block">№ документа *</Label>
              <Input
                id="document-number"
                value={closingDocumentData.documentNumber}
                onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                placeholder="Введите номер документа"
              />
            </div>
          </div>

          {/* Document Date */}
          <div>
            <Label htmlFor="document-date" className="mb-2 block">Дата документа *</Label>
            <Input
              id="document-date"
              type="date"
              value={closingDocumentData.documentDate}
              onChange={(e) => handleInputChange('documentDate', e.target.value)}
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount-without-vat" className="mb-2 block">Сумма без НДС, в валюте *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount-without-vat"
                  type="number"
                  value={closingDocumentData.amountWithoutVat || ''}
                  onChange={(e) => handleInputChange('amountWithoutVat', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vat-amount" className="mb-2 block">Сумма НДС, в валюте *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vat-amount"
                  type="number"
                  value={closingDocumentData.vatAmount || ''}
                  onChange={(e) => handleInputChange('vatAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Currency Display */}
          <div>
            <Label className="mb-2 block">Валюта</Label>
            <div className="p-3 border rounded-lg bg-gray-50">
              <span className="font-medium">{request.currency}</span>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label className="mb-2 block">Прикрепляю закрывающие документы</Label>
            <SimpleFileUpload
              onFilesChange={handleFileUpload}
              onFileRemove={handleFileRemove}
              files={closingDocumentData.files}
              maxFiles={10}
              maxSize={10} // 10MB
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          {/* Original Documents Status */}
          <div>
            <Label htmlFor="original-documents-status" className="mb-2 block">Статус получения оригиналов документов *</Label>
            <Select
              value={closingDocumentData.originalDocumentsStatus}
              onValueChange={(value) => handleInputChange('originalDocumentsStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                {ORIGINAL_DOCUMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="mb-2 block">Комментарий</Label>
            <Textarea
              id="comment"
              value={closingDocumentData.comment || ''}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Дополнительная информация..."
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium text-blue-900 mb-2">Сводка</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Сумма без НДС:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(closingDocumentData.amountWithoutVat, closingDocumentData.currency)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Сумма НДС:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(closingDocumentData.vatAmount, closingDocumentData.currency)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Итого:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(closingDocumentData.amountWithoutVat + closingDocumentData.vatAmount, closingDocumentData.currency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
