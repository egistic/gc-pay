import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileText, 
  Building, 
  User, 
  Calendar, 
  DollarSign, 
  Percent, 
  AlignLeft,
  Eye,
  Download
} from 'lucide-react';
import { PaymentRequest } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatting';

interface RequestInformationCardProps {
  request: PaymentRequest;
  getCounterpartyName: (id: string) => string;
  getCounterpartyCategory?: (id: string) => string;
  getVatRate?: (vatRateId: string | undefined) => string;
  onViewDocument?: () => void;
  onDownloadDocument?: () => void;
  showDocumentActions?: boolean;
  className?: string;
}

export function RequestInformationCard({ 
  request, 
  getCounterpartyName,
  getCounterpartyCategory,
  getVatRate,
  onViewDocument, 
  onDownloadDocument,
  showDocumentActions = true,
  className = ""
}: RequestInformationCardProps) {
  
  const formatDate = (date: string | undefined | null) => {
    if (!date) return 'Не указано';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Некорректная дата';
    }
    
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  };

  const generateDocumentName = (request: PaymentRequest) => {
    if (request.fileName) {
      return request.fileName;
    }
    
    // Generate document name in format: Заявка_REQUEST_NUMBER_DATE_COMPANY_COUNTERPARTY
    const requestNumber = request.requestNumber || 'UNKNOWN';
    const date = new Date(request.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\./g, '');
    const company = request.payingCompany || 'KD';
    const counterpartyName = getCounterpartyName(request.counterpartyId).split(' ')[0]; // Get first word of counterparty name
    
    return `Заявка_${requestNumber}_${date}_${company}_${counterpartyName}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Информация по заявке
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Paying Company */}
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Оплачивающая компания</p>
              <p className="text-sm">{request.payingCompany || 'Не указано'}</p>
            </div>
          </div>

          {/* Document Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Дата документа</p>
              <p className="text-sm">{formatDate(request.docDate)}</p>
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Сумма</p>
              <p className="text-lg font-semibold">{formatCurrency(request.amount, request.currency)}</p>
            </div>
          </div>

          {/* Document Type */}
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Тип документа-основания</p>
              <p className="text-sm">{request.docType || 'Заявка'}</p>
            </div>
          </div>

          {/* Counterparty Category */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Категория контрагента</p>
              <p className="text-sm">
                {getCounterpartyCategory ? getCounterpartyCategory(request.counterpartyId) : (request.counterpartyCategory || 'Не указано')}
              </p>
            </div>
          </div>

          {/* VAT Rate */}
          <div className="flex items-center gap-3">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Ставка НДС</p>
              <p className="text-sm">
                {getVatRate ? getVatRate(request.vatRate) : (request.vatRate || 'Не указано')}
              </p>
            </div>
          </div>

          {/* Document Number */}
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Номер документа</p>
              <p className="text-sm">{request.docNumber}</p>
            </div>
          </div>

          {/* Counterparty Name */}
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Контрагент</p>
              <p className="text-sm">{getCounterpartyName(request.counterpartyId)}</p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Срок оплаты</p>
              <p className="text-sm">{formatDate(request.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {request.description && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-start gap-3">
              <AlignLeft className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Описание</p>
                <div className="text-sm mt-2">
                  {request.description.split('\n').map((line, index) => {
                    const colonIndex = line.indexOf(':');
                    if (colonIndex !== -1) {
                      const label = line.substring(0, colonIndex + 1);
                      const value = line.substring(colonIndex + 1);
                      
                      // Список полей, которые должны быть жирными
                      const boldFields = [
                        'Статья расходов:',
                        'Товар/услуга:',
                        'Объем:',
                        'Цена/тариф:',
                        'Период:'
                      ];
                      
                      const shouldBeBold = boldFields.some(field => 
                        label.toLowerCase().includes(field.toLowerCase())
                      );
                      
                      return (
                        <span key={index} className="inline-block mr-4">
                          <span className={shouldBeBold ? "font-bold" : "font-semibold"}>{label}</span>
                          <span>{value}</span>
                        </span>
                      );
                    }
                    return line.trim() ? <span key={index} className="inline-block mr-4">{line}</span> : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Files */}
        {showDocumentActions && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Документы-основания</p>
                
                {/* Multiple files support */}
                {request.files && request.files.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {request.files.map((file, index) => (
                      <div key={file.id || index} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.originalName || file.name}</p>
                          {file.url && (
                            <p className="text-xs text-muted-foreground">Доступен для просмотра</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {file.url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Просмотр
                            </Button>
                          )}
                          {file.url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.url!;
                                link.download = file.originalName || file.name;
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Скачать
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback to single file or generated name */
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground flex-1">{generateDocumentName(request)}</p>
                    {onViewDocument && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onViewDocument}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                    )}
                    {onDownloadDocument && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onDownloadDocument}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Скачать
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
