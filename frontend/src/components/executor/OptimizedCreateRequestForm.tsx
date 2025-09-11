import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { CounterpartySelect } from '../common/CounterpartySelect';
import { SimpleFileUpload } from '../common/SimpleFileUpload';
import { CalendarIcon, ArrowLeft, Send, Save, FileText, Banknote, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '../ui/utils';
import { 
  Currency, 
  PaymentRequest, 
  PayingCompany, 
  DocumentType, 
  CounterpartyCategory, 
  VATRate 
} from '../../types';
import { generateRequestNumber } from '../../utils/generators';
import { useDictionaryData } from '../../hooks/useDictionaryData';
import { PaymentRequestService } from '../../services/api';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '../../features/payment-requests/hooks/useAutoSaveDraft';
import { buildDocumentFileName } from '../../features/payment-requests/lib/buildDocumentFileName';
import { STATUS_MAP } from '../../features/payment-requests/constants/status-map';

interface OptimizedCreateRequestFormProps {
  onSubmit: (request: Partial<PaymentRequest>) => void;
  onCancel: () => void;
  onSaveDraft?: (request: Partial<PaymentRequest>) => void;
  initialData?: PaymentRequest;
  isEditing?: boolean;
  selectedRequestId?: string;
}

export function OptimizedCreateRequestForm({ onSubmit, onCancel, onSaveDraft, initialData, isEditing, selectedRequestId }: OptimizedCreateRequestFormProps) {
  // Get dictionary data from real API (without statistics)
  const { items: counterparties } = useDictionaryData('counterparties');
  const { items: currencies } = useDictionaryData('currencies');
  const { items: vatRates } = useDictionaryData('vat-rates');
  
  const [formData, setFormData] = useState({
    payingCompany: '' as any,
    docType: '' as any,
    counterpartyId: '',
    counterpartyCategory: '' as any,
    amount: '',
    currency: '' as any,
    vatRate: '' as any,
    dueDate: undefined as Date | undefined,
    docNumber: '',
    docDate: '',
    fileName: '',
    docFileUrl: '',
    files: [] as Array<{id: string, name: string, url: string, originalName: string}>,
    // Comment fields
    expenseCategory: '',
    productService: '',
    volume: '',
    priceRate: '',
    period: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [autoSaveDisabled, setAutoSaveDisabled] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false);
  
  // Ref for synchronous access to draftId (fixes race condition)
  const draftIdRef = React.useRef<string | null>(null);
  
  // Ref to track if form has been submitted (prevents auto-save after submit)
  const hasSubmittedRef = React.useRef<boolean>(false);
  
  // Ref for submit lock (prevents auto-save during submit process)
  const submitLockRef = React.useRef<boolean>(false);

  // Callback to handle draft creation from auto-save
  const handleDraftCreated = useCallback((newDraftId: string) => {
    setDraftId(newDraftId);
    draftIdRef.current = newDraftId;
  }, []);

  // Synchronize ref with state
  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  // Function to reset form to empty state
  const resetFormToEmpty = (): void => {
    setFormData({
      payingCompany: '' as any,
      docType: '' as any,
      counterpartyId: '',
      counterpartyCategory: '' as any,
      amount: '',
      currency: '' as any,
      vatRate: '' as any,
      dueDate: undefined,
      docNumber: '',
      docDate: '',
      fileName: '',
      docFileUrl: '',
      files: [],
      // Comment fields
      expenseCategory: '',
      productService: '',
      volume: '',
      priceRate: '',
      period: ''
    });
  };

  // Function to handle field changes and track user editing
  const onChangeField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    if (!hasUserEdited) setHasUserEdited(true);
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Dynamic status for auto-save (prevents saving after submit)
  const autoSaveStatus = hasSubmittedRef.current ? STATUS_MAP.SUBMITTED : STATUS_MAP.DRAFT;

  // Use the autosave hook
  const { isDirty, isSaving, lastSaved, error: autosaveError, markClean, cancelAutoSave } = useAutoSaveDraft({
    formData: {
      id: draftId || undefined,
      payingCompany: formData.payingCompany as PayingCompany,
      docType: formData.docType as DocumentType,
      counterpartyId: formData.counterpartyId,
      counterpartyCategory: formData.counterpartyCategory as CounterpartyCategory,
      amount: formData.amount ? Number(formData.amount.replace(',', '.')) : 0,
      currency: formData.currency as Currency,
      vatRate: formData.vatRate as VATRate,
      dueDate: formData.dueDate?.toISOString().split('T')[0] || '',
      description: [
        formData.expenseCategory && `Статья расходов: ${formData.expenseCategory}`,
        formData.productService && `Товар/услуга: ${formData.productService}`,
        formData.volume && `Объем: ${formData.volume}`,
        formData.priceRate && `Цена/тариф: ${formData.priceRate}`,
        formData.period && `Период: ${formData.period}`
      ].filter(Boolean).join(', '),
      expenseCategory: formData.expenseCategory,
      productService: formData.productService,
      volume: formData.volume,
      priceRate: formData.priceRate,
      period: formData.period,
      docNumber: formData.docNumber,
      docDate: formData.docDate,
      fileName: formData.fileName,
      docFileUrl: formData.docFileUrl,
      files: formData.files || [],
      status: autoSaveStatus, // Dynamic status - prevents saving after submit
      createdBy: '3394830b-1b62-4db4-a6e4-fdf76b5033f5', // This should come from auth context
      history: [],
      expenseSplits: [],
      paymentAllocations: [],
      paymentExecution: undefined,
      attachments: []
    },
    draftId: draftId || undefined,
    enabled: hasUserEdited && !isSubmitting && !isSavingDraft && !showConfirmDialog && !autoSaveDisabled && !hasSubmittedRef.current && !submitLockRef.current, // Only enable if user has edited and not submitted and not locked
    autoSaveDisabled: autoSaveDisabled,
    onDraftCreated: handleDraftCreated
  });

  // Helper function to create request data object
  const createRequestData = (isDraft: boolean = false): Partial<PaymentRequest> => {
    const description = [
      formData.expenseCategory && `Статья расходов: ${formData.expenseCategory}`,
      formData.productService && `Товар/услуга: ${formData.productService}`,
      formData.volume && `Объем: ${formData.volume}`,
      formData.priceRate && `Цена/тариф: ${formData.priceRate}`,
      formData.period && `Период: ${formData.period}`
    ].filter(Boolean).join(', ');

    return {
      ...(draftId ? { id: draftId } : {}),
      // Only generate requestNumber for new submissions (not drafts)
      ...(draftId ? {} : { requestNumber: generateRequestNumber() }),
      payingCompany: (formData.payingCompany as PayingCompany) || ('' as PayingCompany),
      docType: (formData.docType as DocumentType) || ('' as DocumentType),
      counterpartyId: formData.counterpartyId,
      counterpartyCategory: formData.counterpartyCategory as CounterpartyCategory,
      amount: formData.amount ? Number(formData.amount.replace(',', '.')) : 0,
      currency: (formData.currency as Currency) || ('' as Currency),
      vatRate: formData.vatRate || 'Неизвестно',
      dueDate: formData.dueDate?.toISOString().split('T')[0] || '',
      description,
      expenseCategory: formData.expenseCategory,
      productService: formData.productService,
      volume: formData.volume,
      priceRate: formData.priceRate,
      period: formData.period,
      docNumber: formData.docNumber,
      docDate: formData.docDate,
      fileName: formData.fileName,
      docFileUrl: formData.docFileUrl,
      files: formData.files || [],
      ...(isDraft ? { status: STATUS_MAP.DRAFT } : {}),
      ...(draftId ? 
        { updatedAt: new Date().toISOString() } : 
        { createdAt: new Date().toISOString() }
      ),
      history: [
        {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          action: isDraft ? 'Черновик сохранен' : 'Заявка отправлена на рассмотрение',
          userId: '3394830b-1b62-4db4-a6e4-fdf76b5033f5',
          role: 'EXECUTOR'
        }
      ],
      expenseSplits: []
    };
  };

  // Initialize form data from initialData if editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        payingCompany: (initialData.payingCompany || '') as any,
        docType: (initialData.docType || '') as any,
        counterpartyId: initialData.counterpartyId || '',
        counterpartyCategory: (initialData.counterpartyCategory || '') as any,
        amount: initialData.amount ? initialData.amount.toLocaleString('ru-RU', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) : '',
        currency: (initialData.currency || '') as any,
        vatRate: (initialData.vatRate || '') as any,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : undefined,
        docNumber: initialData.docNumber || '',
        docDate: initialData.docDate || '',
        fileName: initialData.fileName || '',
        docFileUrl: initialData.docFileUrl || '',
        files: initialData.files || [],
        // Comment fields
        expenseCategory: initialData.expenseCategory || '',
        productService: initialData.productService || '',
        volume: initialData.volume || '',
        priceRate: initialData.priceRate || '',
        period: initialData.period || ''
      });
      // Set the draft ID for editing
      setDraftId(initialData.id);
      draftIdRef.current = initialData.id;
      
      // If initialData has non-DRAFT status, disable auto-save
      if (initialData.status && initialData.status !== STATUS_MAP.DRAFT) {
        setAutoSaveDisabled(true);
        hasSubmittedRef.current = true;
      }
    }
  }, [initialData, isEditing]);

  // Initialize draft ID from selectedRequestId if provided
  useEffect(() => {
    if (selectedRequestId && !isEditing) {
      setDraftId(selectedRequestId);
      draftIdRef.current = selectedRequestId;
    }
  }, [selectedRequestId, isEditing]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      cancelAutoSave();
    };
  }, [cancelAutoSave]);

  const handleFileSelect = (file: File) => {
    // Generate new filename based on form data with increment
    const newFileName = generateFileName();
    const fileExtension = file.name.split('.').pop();
    const increment = ((formData.files?.length || 0) + 1).toString().padStart(2, '0');
    const finalFileName = newFileName ? `${newFileName}_${increment}.${fileExtension}` : file.name;
    
    const newFile = {
      id: `file_${Date.now()}`,
      name: finalFileName,
      url: `/uploads/${finalFileName}`,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      docType: formData.docType || 'Заявка'
    };
    
    setFormData(prev => ({ 
      ...prev, 
      files: [...(prev.files || []), newFile],
      // Keep backward compatibility
      docFileUrl: newFile.url,
      fileName: newFile.name
    }));
    
    // Show success message
    toast.success('Файл загружен');
  };

  // Generate file name using the shared utility
  const generateFileName = () => {
    if (!formData.docType || !formData.docNumber || !formData.docDate || !formData.payingCompany || !formData.counterpartyId) {
      return '';
    }
    
    const counterparty = counterparties.find(cp => cp.id === formData.counterpartyId);
    const counterpartyName = counterparty?.name || 'Unknown';
    
    return buildDocumentFileName({
      docType: formData.docType,
      docNumber: formData.docNumber,
      docDate: formData.docDate,
      payingCompany: formData.payingCompany,
      counterpartyName
    });
  };

  // Update file name when relevant fields change
  useEffect(() => {
    const autoFileName = generateFileName();
    if (autoFileName && !formData.fileName.includes('original_')) {
      setFormData(prev => ({ ...prev, fileName: autoFileName }));
    }
  }, [formData.docType, formData.docNumber, formData.docDate, formData.payingCompany, formData.counterpartyId]);

  const handleFileNameChange = (fileName: string) => {
    setFormData(prev => ({ ...prev, fileName }));
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData(prev => {
      const updatedFiles = (prev.files || []).filter(file => file.id !== fileId);
      return {
        ...prev,
        files: updatedFiles,
        // Update backward compatibility fields
        docFileUrl: updatedFiles[0]?.url || '',
        fileName: updatedFiles[0]?.name || ''
      };
    });
    toast.success('Файл удален');
  };

  const handleViewFile = (fileUrl: string) => {
    // In real app, this would open the file in a new tab or modal
    window.open(fileUrl, '_blank');
  };

  // Handle amount input - simplified without formatting to prevent cursor jumping
  const handleAmountChange = (value: string) => {
    // Allow only numbers, comma, and dot
    const cleanValue = value.replace(/[^\d.,]/g, '');
    setFormData(prev => ({ ...prev, amount: cleanValue }));
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Document section validation
    if (!formData.payingCompany) {
      newErrors.payingCompany = 'Выберите оплачивающую компанию';
    }
    if (!formData.docType) {
      newErrors.docType = 'Выберите тип документа-основания';
    }
    if (!formData.counterpartyCategory) {
      newErrors.counterpartyCategory = 'Выберите категорию контрагента';
    }
    if (!formData.counterpartyId) {
      newErrors.counterparty = 'Выберите контрагента';
    }
    if (!formData.docNumber) {
      newErrors.docNumber = 'Номер документа обязателен';
    }
    if (!formData.docDate) {
      newErrors.docDate = 'Дата документа обязательна';
    }
    // File is now always required
    if ((formData.files?.length || 0) === 0) {
      newErrors.file = 'Необходимо приложить документ-основание';
    }

    // Payment section validation
    if (!formData.amount || isNaN(Number(formData.amount.replace(',', '.'))) || Number(formData.amount.replace(',', '.')) <= 0) {
      newErrors.amount = 'Введите корректную сумму';
    }
    if (!formData.currency || formData.currency.trim() === '') {
      newErrors.currency = 'Валюта обязательна для заполнения';
    }
    if (!formData.vatRate || formData.vatRate.trim() === '') {
      newErrors.vatRate = 'Ставка НДС обязательна для заполнения';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Выберите срок оплаты';
    }

    // Comment fields validation
    if (!formData.expenseCategory.trim()) {
      newErrors.expenseCategory = 'Статья расходов обязательна для заполнения';
    }
    if (!formData.productService.trim()) {
      newErrors.productService = 'Товар/услуга обязательны для заполнения';
    }
    if (!formData.volume.trim()) {
      newErrors.volume = 'Объем обязателен для заполнения';
    }
    if (!formData.priceRate.trim()) {
      newErrors.priceRate = 'Цена/тариф обязательны для заполнения';
    }
    if (!formData.period.trim()) {
      newErrors.period = 'Период обязателен для заполнения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    // 🔒 Enable submit lock and immediately disable auto-save
    submitLockRef.current = true;
    cancelAutoSave(); // Cancel any pending auto-save timers
    setAutoSaveDisabled(true); // Instantly disable auto-save hook
    setShowConfirmDialog(true);
  };

  // Unified function to handle both auto-save and submit
  const createOrUpdateDraftAndSubmit = async (): Promise<Partial<PaymentRequest>> => {
    // Cancel any pending auto-save FIRST
    cancelAutoSave();
    
    // Wait for any ongoing auto-save to complete
    let attempts = 0;
    while (isSaving && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // If submit lock is active and no draft exists, wait for onDraftCreated if it was in flight
    if (submitLockRef.current && draftIdRef.current == null && draftId == null) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Check if we have a draft ID from ref (synchronous access)
    let currentDraftId = draftIdRef.current ?? draftId;
    
    if (!currentDraftId) {
      // Create a new draft with current form data (valid path)
      const requestData = createRequestData(true);
      const newDraft = await PaymentRequestService.create(requestData);
      currentDraftId = newDraft.id;
      setDraftId(currentDraftId);
      draftIdRef.current = currentDraftId;
      
      // Submit the newly created draft
      return await PaymentRequestService.submit(currentDraftId);
    } else {
      // Update existing draft with current form data, then submit
      const requestData = createRequestData(false);
      const { status, ...updateData } = requestData;
      await PaymentRequestService.update(currentDraftId, updateData);
      
      // Submit the updated draft
      return await PaymentRequestService.submit(currentDraftId);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // 🔒 Блокируем автосейв до начала submit
    submitLockRef.current = true;
    hasSubmittedRef.current = true;
    setAutoSaveDisabled(true);
    cancelAutoSave();
    
    try {
      const submittedRequest = await createOrUpdateDraftAndSubmit();
      
      // ❗ Mark as clean since we're submitting
      markClean();

      // ❗ Reset draftId and form to prevent auto-save from creating new DRAFT
      setDraftId(null);
      draftIdRef.current = null;
      resetFormToEmpty();
      setHasUserEdited(false);
      
      toast.success('Заявка успешно отправлена на рассмотрение');
      onSubmit(submittedRequest);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Ошибка при отправке заявки');
      // Восстанавливаем блоки только при ошибке
      hasSubmittedRef.current = false;
      setAutoSaveDisabled(false);
      submitLockRef.current = false;
    } finally {
      submitLockRef.current = false; // 🔓 Release submit lock ONLY in finally
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isSavingDraft) {
      return; // Prevent multiple simultaneous saves
    }
    
    try {
      setIsSavingDraft(true);
      
      // Use the same unified logic for saving
      if (!draftId) {
        // Create a new draft
        console.log('📝 Manual save: Creating new draft...');
        const requestData = createRequestData(true);
        const newDraft = await PaymentRequestService.create(requestData);
        setDraftId(newDraft.id);
        draftIdRef.current = newDraft.id;
        
        markClean();
        toast.success('Черновик сохранен');
        if (onSaveDraft) {
          onSaveDraft(newDraft);
        }
      } else {
        // Update existing draft
        console.log('🔄 Manual save: Updating existing draft...');
        const requestData = createRequestData(true);
        const savedDraft = await PaymentRequestService.update(draftId, requestData);
        
        markClean();
        toast.success('Черновик сохранен');
        if (onSaveDraft) {
          onSaveDraft(savedDraft);
        }
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Ошибка при сохранении черновика');
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isEditing ? 'Редактирование заявки' : 'Новая заявка на оплату'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Внесите изменения в заявку' : 'Заполните форму для создания новой заявки'}
            </p>
          </div>
        </div>
        
        {/* Auto-save status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving && (
            <div className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Сохранение...</span>
            </div>
          )}
          {lastSaved && !isSaving && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Сохранено {format(lastSaved, 'HH:mm', { locale: ru })}</span>
            </div>
          )}
          {isDirty && !isSaving && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <span>Есть несохраненные изменения</span>
            </div>
          )}
        </div>
      </div>

      {/* Auto-save error */}
      {autosaveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            Ошибка автосохранения: {autosaveError}
          </p>
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-6">
        {/* Document Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Информация о документе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payingCompany">Оплачивающая компания *</Label>
                <Select
                  value={formData.payingCompany || ''}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, payingCompany: value as PayingCompany }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите компанию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="KD">KD</SelectItem>
                    <SelectItem value="AEK">AEK</SelectItem>
                    <SelectItem value="ADT">ADT</SelectItem>
                    <SelectItem value="KAS">KAS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payingCompany && (
                  <p className="text-sm text-red-500 mt-1">{errors.payingCompany}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="docType">Тип документа-основания *</Label>
                <Select
                  value={formData.docType || ''}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, docType: value as DocumentType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="СНО">СНО</SelectItem>
                    <SelectItem value="АО">АО</SelectItem>
                    <SelectItem value="Договор">Договор</SelectItem>
                    <SelectItem value="Debit note">Debit note</SelectItem>
                    <SelectItem value="АВР">АВР</SelectItem>
                    <SelectItem value="Акт сверки">Акт сверки</SelectItem>
                    <SelectItem value="ЭСФ">ЭСФ</SelectItem>
                    <SelectItem value="Заявка">Заявка</SelectItem>
                    <SelectItem value="Счет-фактура">Счет-фактура</SelectItem>
                    <SelectItem value="Акт выполненных работ">Акт выполненных работ</SelectItem>
                    <SelectItem value="Накладная">Накладная</SelectItem>
                  </SelectContent>
                </Select>
                {errors.docType && (
                  <p className="text-sm text-red-500 mt-1">{errors.docType}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <CounterpartySelect
                value={formData.counterpartyId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, counterpartyId: value }))}
                filterByCategory={formData.counterpartyCategory as CounterpartyCategory}
                onCategoryChange={(category) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    counterpartyCategory: category,
                    counterpartyId: '' // Reset counterparty when category changes
                  }));
                }}
              />
              {errors.counterparty && (
                <p className="text-sm text-red-500 mt-1">{errors.counterparty}</p>
              )}
              {errors.counterpartyCategory && (
                <p className="text-sm text-red-500 mt-1">{errors.counterpartyCategory}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docNumber">Номер документа *</Label>
                <Input
                  id="docNumber"
                  value={formData.docNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, docNumber: e.target.value }))}
                  placeholder="Введите номер документа"
                />
                {errors.docNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.docNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="docDate">Дата документа *</Label>
                <Input
                  id="docDate"
                  type="date"
                  value={formData.docDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, docDate: e.target.value }))}
                />
                {errors.docDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.docDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Документы-основания *</Label>
              <SimpleFileUpload
                onFileSelect={handleFileSelect}
                onFileNameChange={handleFileNameChange}
                currentFileName={formData.fileName}
                files={formData.files}
                onRemoveFile={handleRemoveFile}
                onViewFile={handleViewFile}
                acceptedTypes={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png']}
                maxSize={10}
                multiple={true}
              />
              {errors.file && (
                <p className="text-sm text-red-500 mt-1">{errors.file}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Информация об оплате
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма *</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0,00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Валюта *</Label>
                <Select
                  value={formData.currency || ''}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, currency: value as Currency }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите валюту" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name || currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-500 mt-1">{errors.currency}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">Ставка НДС *</Label>
                <Select
                  value={formData.vatRate || ''}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, vatRate: value as VATRate }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите ставку НДС" />
                  </SelectTrigger>
                  <SelectContent>
                    {vatRates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.name}>
                        {rate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vatRate && (
                  <p className="text-sm text-red-500 mt-1">{errors.vatRate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Срок оплаты *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date: Date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dueDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Description Fields */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Описание заявки</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expenseCategory" className="text-xs">Статья расходов *</Label>
                  <Input
                    id="expenseCategory"
                    value={formData.expenseCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, expenseCategory: e.target.value }))}
                    placeholder="Введите статью расходов"
                    className="h-8 text-sm"
                  />
                  {errors.expenseCategory && (
                    <p className="text-xs text-red-500 mt-1">{errors.expenseCategory}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productService" className="text-xs">Товар/услуга *</Label>
                  <Input
                    id="productService"
                    value={formData.productService}
                    onChange={(e) => setFormData(prev => ({ ...prev, productService: e.target.value }))}
                    placeholder="Введите товар или услугу"
                    className="h-8 text-sm"
                  />
                  {errors.productService && (
                    <p className="text-xs text-red-500 mt-1">{errors.productService}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="volume" className="text-xs">Объем *</Label>
                  <Input
                    id="volume"
                    value={formData.volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                    placeholder="Введите объем"
                    className="h-8 text-sm"
                  />
                  {errors.volume && (
                    <p className="text-xs text-red-500 mt-1">{errors.volume}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRate" className="text-xs">Цена/тариф *</Label>
                  <Input
                    id="priceRate"
                    value={formData.priceRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceRate: e.target.value }))}
                    placeholder="Введите цену или тариф"
                    className="h-8 text-sm"
                  />
                  {errors.priceRate && (
                    <p className="text-xs text-red-500 mt-1">{errors.priceRate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period" className="text-xs">Период *</Label>
                  <Input
                    id="period"
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                    placeholder="Введите период"
                    className="h-8 text-sm"
                  />
                  {errors.period && (
                    <p className="text-xs text-red-500 mt-1">{errors.period}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSubmitting || isSavingDraft}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSavingDraft ? 'Сохранение...' : 'Сохранить черновик'}
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение отправки</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите отправить заявку на рассмотрение? После отправки вы не сможете редактировать заявку.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleConfirmSubmit}>
              Отправить заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}