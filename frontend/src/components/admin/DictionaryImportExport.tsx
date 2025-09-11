import React, { useState, useCallback, useRef } from 'react';
import { DictionaryImportExportService } from '../../services/dictionaryImportExportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Filter,
  Settings,
  RefreshCw
} from 'lucide-react';
import { DictionaryType, ImportExportOptions, ValidationError } from '../../types/dictionaries';

interface DictionaryImportExportProps {
  dictionaryType: DictionaryType;
  onImport: (file: File, options: ImportExportOptions) => Promise<{ success: any[]; errors: ValidationError[] }>;
  onExport: (options: ImportExportOptions) => Promise<Blob>;
  onBack: () => void;
}

interface ImportResult {
  success: any[];
  errors: ValidationError[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

export function DictionaryImportExport({ 
  dictionaryType, 
  onImport, 
  onExport, 
  onBack 
}: DictionaryImportExportProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportExportOptions>({
    format: 'csv',
    includeInactive: false,
    dateRange: undefined,
    fields: undefined
  });
  const [exportOptions, setExportOptions] = useState<ImportExportOptions>({
    format: 'csv',
    includeInactive: false,
    dateRange: undefined,
    fields: undefined
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: FileText },
    { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
    { value: 'json', label: 'JSON', icon: FileJson },
  ];

  const dictionaryLabels: Record<DictionaryType, string> = {
    'expense-articles': 'Статьи расходов',
    'counterparties': 'Контрагенты',
    'contracts': 'Контракты',
    'normatives': 'Нормативы',
    'priorities': 'Приоритеты',
    'users': 'Пользователи',
    'currencies': 'Валюты',
    'vat-rates': 'НДС ставки'
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Auto-detect format based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        setImportOptions(prev => ({ ...prev, format: 'xlsx' }));
      } else if (extension === 'json') {
        setImportOptions(prev => ({ ...prev, format: 'json' }));
      } else {
        setImportOptions(prev => ({ ...prev, format: 'csv' }));
      }
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await DictionaryImportExportService.importData(
        dictionaryType,
        importFile,
        importOptions.includeInactive || false
      );
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      const importResult: ImportResult = {
        success: result.success_records,
        errors: result.errors,
        totalProcessed: result.total_processed,
        successCount: result.success_count,
        errorCount: result.error_count
      };
      
      setImportResult(importResult);
      setShowImportDialog(false);
      setShowResultsDialog(true);
      
      // Reset form
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importFile, importOptions, dictionaryType]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const result = await DictionaryImportExportService.exportData(
        dictionaryType,
        exportOptions.format,
        exportOptions.includeInactive || false,
        exportOptions.dateRange
      );
      
      // Download the file
      DictionaryImportExportService.downloadFile(
        result.content,
        result.filename,
        result.content_type
      );
      
      setShowExportDialog(false);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [exportOptions, dictionaryType]);

  const downloadTemplate = useCallback(async () => {
    try {
      const result = await DictionaryImportExportService.getTemplate(
        dictionaryType,
        importOptions.format
      );
      
      DictionaryImportExportService.downloadFile(
        result.content,
        result.filename,
        result.content_type
      );
    } catch (error) {
      console.error('Template download error:', error);
    }
  }, [dictionaryType, importOptions.format]);

  // Template data functions removed - now using real API calls

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Импорт/Экспорт справочника</h2>
          <p className="text-muted-foreground">
            Управление данными справочника "{dictionaryLabels[dictionaryType]}"
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Импорт данных
            </CardTitle>
            <CardDescription>
              Загрузите файл для импорта данных в справочник
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="import-file">Выберите файл</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="mt-1"
              />
              {importFile && (
                <div className="mt-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{importFile.name}</span>
                  <Badge variant="outline">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="import-format">Формат файла</Label>
              <Select 
                value={importOptions.format} 
                onValueChange={(value) => setImportOptions(prev => ({ ...prev, format: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center gap-2">
                        <format.icon className="h-4 w-4" />
                        {format.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-inactive"
                  checked={importOptions.includeInactive}
                  onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, includeInactive: checked as boolean }))}
                />
                <Label htmlFor="include-inactive">Включить неактивные записи</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowImportDialog(true)}
                disabled={!importFile || isImporting}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Импортировать
              </Button>
              <Button 
                onClick={downloadTemplate}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Шаблон
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Экспорт данных
            </CardTitle>
            <CardDescription>
              Экспортируйте данные справочника в файл
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="export-format">Формат экспорта</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center gap-2">
                        <format.icon className="h-4 w-4" />
                        {format.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-inactive"
                  checked={exportOptions.includeInactive}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeInactive: checked as boolean }))}
                />
                <Label htmlFor="export-inactive">Включить неактивные записи</Label>
              </div>
            </div>

            <Button 
              onClick={() => setShowExportDialog(true)}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Экспортировать
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Progress */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Импорт данных...</span>
                <span className="text-sm text-muted-foreground">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение импорта</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите импортировать данные из файла "{importFile?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Формат: {importOptions.format.toUpperCase()}</p>
              <p>Включить неактивные: {importOptions.includeInactive ? 'Да' : 'Нет'}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Импорт...' : 'Импортировать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки экспорта</DialogTitle>
            <DialogDescription>
              Настройте параметры экспорта данных
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Формат: {exportOptions.format.toUpperCase()}</p>
              <p>Включить неактивные: {exportOptions.includeInactive ? 'Да' : 'Нет'}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Экспорт...' : 'Экспортировать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Результаты импорта</DialogTitle>
            <DialogDescription>
              Импорт завершен. Просмотрите результаты ниже.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {importResult && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                    <div className="text-sm text-muted-foreground">Успешно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
                    <div className="text-sm text-muted-foreground">Ошибки</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{importResult.totalProcessed}</div>
                    <div className="text-sm text-muted-foreground">Всего</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Ошибки валидации:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Строка</TableHead>
                            <TableHead>Поле</TableHead>
                            <TableHead>Ошибка</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.field}</TableCell>
                              <TableCell>{error.code}</TableCell>
                              <TableCell className="text-red-600">{error.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setShowResultsDialog(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
