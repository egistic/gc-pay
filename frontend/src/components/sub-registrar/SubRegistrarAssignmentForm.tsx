import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Upload, 
  FileText, 
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus
} from 'lucide-react';
import { useDictionaryData } from '../../hooks/useDictionaryData';
import { formatCurrency } from '../../utils/formatting';
import { formatDateSafe } from '../../features/payment-requests/lib/formatDateSafe';
import { PaymentRequestService } from '../../services/paymentRequestService';
import { useAuth } from '../../context/AuthContext';
import { RequestInformationCard } from '../common/RequestInformationCard';
import { toast } from 'sonner';

interface SubRegistrarAssignmentFormProps {
  requestId: string;
  onBack: () => void;
  onSave?: (assignmentData: any) => void;
  onPublish?: (assignmentData: any) => void;
}

interface AssignmentData {
  // Registrar assigned fields (read-only)
  expenseArticle?: string;
  assignedAmount?: number;
  registrarComments?: string;
  assignedSubRegistrar?: string;
  
  // Sub-registrar fields (editable)
  documentType?: string;
  documentNumber?: string;
  documentDate?: string;
  attachedDocuments?: File[];
  amountWithoutVat?: number;
  vatAmount?: number;
  originalDocumentStatus?: string;
  subRegistrarComments?: string;
  
  // Status
  isDraft?: boolean;
  isPublished?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'avr', label: 'АВР' },
  { value: 'other', label: 'Другое' },
  { value: 'invoice', label: 'Инвойс' },
  { value: 'upd', label: 'УПД' },
  { value: 'esf', label: 'ЭСФ' },
  { value: 'ao', label: 'АО' }
];

const ORIGINAL_DOCUMENT_STATUSES = [
  { value: 'not_received', label: 'Не получены' },
  { value: 'fully_received', label: 'Получены в полном объеме' },
  { value: 'partially_received', label: 'Частично получены' }
];

const SubRegistrarAssignmentForm: React.FC<SubRegistrarAssignmentFormProps> = ({
  requestId,
  onBack,
  onSave,
  onPublish
}) => {
  const { user } = useAuth();
  const { items: expenseArticles } = useDictionaryData('expense_articles');
  const { items: users } = useDictionaryData('users');
  const { items: counterparties } = useDictionaryData('counterparties');
  
  const [request, setRequest] = useState<any>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showRequestInfo, setShowRequestInfo] = useState(true);

  // Load request and assignment data
  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        const requestData = await PaymentRequestService.getById(requestId);
        if (requestData) {
          setRequest(requestData);
          
          // Load registrar assignment data
          let registrarAssignment = {
            expenseArticle: requestData.expense_article_text || requestData.lines?.[0]?.article_id,
            assignedAmount: requestData.amount_total,
            registrarComments: requestData.lines?.[0]?.note || '',
            assignedSubRegistrar: requestData.responsible_registrar_id
          };
          
          try {
            const registrarData = await PaymentRequestService.getRegistrarAssignment(requestId);
            if (registrarData) {
              registrarAssignment = {
                expenseArticle: registrarData.expense_article_id,
                assignedAmount: registrarData.assigned_amount,
                registrarComments: registrarData.registrar_comments,
                assignedSubRegistrar: registrarData.assigned_sub_registrar_id
              };
            }
          } catch (error) {
            console.log('No registrar assignment found, using request data');
          }
          
          // Load sub-registrar assignment data
          let subRegistrarData = {
            documentType: '',
            documentNumber: '',
            documentDate: '',
            amountWithoutVat: 0,
            vatAmount: 0,
            originalDocumentStatus: '',
            subRegistrarComments: '',
            isDraft: true,
            isPublished: false
          };
          
          try {
            const existingData = await PaymentRequestService.getSubRegistrarAssignmentData(requestId);
            if (existingData) {
              subRegistrarData = {
                documentType: existingData.document_type,
                documentNumber: existingData.document_number,
                documentDate: existingData.document_date,
                amountWithoutVat: existingData.amount_without_vat,
                vatAmount: existingData.vat_amount,
                originalDocumentStatus: existingData.original_document_status,
                subRegistrarComments: existingData.sub_registrar_comments,
                isDraft: existingData.is_draft,
                isPublished: existingData.is_published
              };
            }
          } catch (error) {
            console.log('Error loading sub-registrar assignment data, using defaults:', error);
          }
          
          setAssignmentData({
            // Registrar assigned fields (from classification)
            expenseArticle: registrarAssignment.expenseArticle,
            assignedAmount: registrarAssignment.assignedAmount,
            registrarComments: registrarAssignment.registrarComments,
            assignedSubRegistrar: registrarAssignment.assignedSubRegistrar,
            
            // Sub-registrar fields (editable)
            documentType: subRegistrarData.documentType,
            documentNumber: subRegistrarData.documentNumber,
            documentDate: subRegistrarData.documentDate,
            amountWithoutVat: subRegistrarData.amountWithoutVat,
            vatAmount: subRegistrarData.vatAmount,
            originalDocumentStatus: subRegistrarData.originalDocumentStatus,
            subRegistrarComments: subRegistrarData.subRegistrarComments,
            isDraft: subRegistrarData.isDraft,
            isPublished: subRegistrarData.isPublished
          });
        }
      } catch (error) {
        console.error('Error loading request:', error);
        toast.error('Ошибка загрузки заявки');
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId]);

  const handleInputChange = useCallback((field: keyof AssignmentData, value: any) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      // Prepare data for API
      const apiData = {
        request_id: requestId,
        document_type: assignmentData.documentType,
        document_number: assignmentData.documentNumber,
        document_date: assignmentData.documentDate,
        amount_without_vat: assignmentData.amountWithoutVat,
        vat_amount: assignmentData.vatAmount,
        currency_code: request?.currency_code || 'KZT',
        original_document_status: assignmentData.originalDocumentStatus,
        sub_registrar_comments: assignmentData.subRegistrarComments,
        is_draft: true,
        is_published: false
      };
      
      // Try to update existing data, if not found, create new
      try {
        await PaymentRequestService.updateSubRegistrarAssignmentData(requestId, apiData);
      } catch (error) {
        // If update fails, try to create new
        await PaymentRequestService.createSubRegistrarAssignmentData(apiData);
      }
      
      toast.success('Заявка сохранена как черновик');
      onSave?.(assignmentData);
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Ошибка сохранения заявки');
    } finally {
      setSaving(false);
    }
  }, [assignmentData, requestId, onSave, request]);

  const handlePublish = useCallback(async () => {
    try {
      setPublishing(true);
      
      // Prepare data for API
      const apiData = {
        request_id: requestId,
        document_type: assignmentData.documentType,
        document_number: assignmentData.documentNumber,
        document_date: assignmentData.documentDate,
        amount_without_vat: assignmentData.amountWithoutVat,
        vat_amount: assignmentData.vatAmount,
        currency_code: request?.currency_code || 'KZT',
        original_document_status: assignmentData.originalDocumentStatus,
        sub_registrar_comments: assignmentData.subRegistrarComments,
        is_draft: false,
        is_published: true
      };
      
      // Try to update existing data, if not found, create new
      try {
        await PaymentRequestService.updateSubRegistrarAssignmentData(requestId, apiData);
      } catch (error) {
        // If update fails, try to create new
        await PaymentRequestService.createSubRegistrarAssignmentData(apiData);
      }
      
      toast.success('Заявка опубликована в фактическом отчете');
      onPublish?.(assignmentData);
    } catch (error) {
      console.error('Error publishing assignment:', error);
      toast.error('Ошибка публикации заявки');
    } finally {
      setPublishing(false);
    }
  }, [assignmentData, requestId, onPublish, request]);

  const getExpenseArticleName = (id: string) => {
    return expenseArticles.find(article => article.id === id)?.name || 'Неизвестная статья';
  };

  const getUserName = (id: string) => {
    return users.find(u => u.id === id)?.fullName || 'Неизвестный пользователь';
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find(cp => cp.id === id)?.name || 'Неизвестный контрагент';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка заявки...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Заявка не найдена</h3>
        <p className="text-muted-foreground mb-4">Заявка с указанным ID не существует</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Заявка № {request?.requestNumber || request?.docNumber || 'N/A'}
          </h1>
        </div>
        <Badge 
          variant={assignmentData.isPublished ? "default" : assignmentData.isDraft ? "secondary" : "outline"}
          className={assignmentData.isDraft ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
        >
          {assignmentData.isPublished ? "Опубликовано" : assignmentData.isDraft ? "Черновик" : "Новая"}
        </Badge>
      </div>

      {/* Request Information - Using RequestInformationCard */}
      {showRequestInfo && request && (
        
          <RequestInformationCard
            request={request}
            getCounterpartyName={getCounterpartyName}
            onRequestUpdate={(updatedRequest) => {
              setRequest(updatedRequest);
            }}
          />
        
      )}

      {/* Registrar Assignment Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Назначение регистратора
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Статья расходов</Label>
              <p className="text-sm font-medium">
                {assignmentData.expenseArticle ? getExpenseArticleName(assignmentData.expenseArticle) : 'Не назначена'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Назначенная сумма</Label>
              <p className="text-sm font-medium">
                {assignmentData.assignedAmount ? formatCurrency(assignmentData.assignedAmount, request.currency) : 'Не указана'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Назначенный суб-регистратор</Label>
              <p className="text-sm font-medium">
                {assignmentData.assignedSubRegistrar ? getUserName(assignmentData.assignedSubRegistrar) : 'Не назначен'}
              </p>
            </div>
          </div>
          {assignmentData.registrarComments && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Комментарии регистратора</Label>
              <p className="text-sm bg-muted p-3 rounded-md">{assignmentData.registrarComments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-registrar Assignment Form - Optimized Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Дополнительная информация суб-регистратора
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Document Information Group */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Информация о документе</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Тип закрывающего документа</Label>
                <Select 
                  value={assignmentData.documentType || ''} 
                  onValueChange={(value) => handleInputChange('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип документа" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">№ документа</Label>
                <Input
                  id="documentNumber"
                  value={assignmentData.documentNumber || ''}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  placeholder="Введите номер документа"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentDate">Дата документа</Label>
                <Input
                  id="documentDate"
                  type="date"
                  value={assignmentData.documentDate || ''}
                  onChange={(e) => handleInputChange('documentDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* File Attachments Group */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Прикрепление документов</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Добавить файлы
                </Button>
              </div>
              
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Прикрепленные файлы</Label>
                  <div className="space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Financial Information Group */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Финансовая информация</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountWithoutVat">Сумма без НДС</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amountWithoutVat"
                    type="number"
                    step="0.01"
                    value={assignmentData.amountWithoutVat || ''}
                    onChange={(e) => handleInputChange('amountWithoutVat', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatAmount">Сумма НДС</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vatAmount"
                    type="number"
                    step="0.01"
                    value={assignmentData.vatAmount || ''}
                    onChange={(e) => handleInputChange('vatAmount', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Document Status Group */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Статус документов</h4>
            <div className="space-y-2">
              <Label htmlFor="originalDocumentStatus">Статус получения оригиналов</Label>
              <Select 
                value={assignmentData.originalDocumentStatus || ''} 
                onValueChange={(value) => handleInputChange('originalDocumentStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGINAL_DOCUMENT_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Comments Group */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Комментарии суб-регистратора</h4>
            <div className="space-y-2">
              <Textarea
                value={assignmentData.subRegistrarComments || ''}
                onChange={(e) => handleInputChange('subRegistrarComments', e.target.value)}
                placeholder="Дополнительная информация о заявке..."
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving || publishing}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить черновик'}
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={saving || publishing || !assignmentData.documentType || !assignmentData.documentNumber}
          >
            <Send className="h-4 w-4 mr-2" />
            {publishing ? 'Публикация...' : 'Опубликовать'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubRegistrarAssignmentForm;
