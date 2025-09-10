import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, FileText, Save, Send, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SubRegistrarService } from '../../services/subRegistrarService';
import { PaymentRequestService } from '../../services/paymentRequestService';
import { NotificationService } from '../../services/notificationService';
import { WorkflowStateService } from '../../services/workflowStateService';
import { 
  SubRegistrarAssignment, 
  SubRegistrarReport, 
  PaymentRequest,
  DocumentStatus,
  ReportStatus 
} from '../../types';
import { toast } from 'sonner';

interface SubRegistrarAssignmentsListProps {
  onReportUpdate?: () => void;
}

export const SubRegistrarAssignmentsList: React.FC<SubRegistrarAssignmentsListProps> = ({
  onReportUpdate
}) => {
  const [assignments, setAssignments] = useState<SubRegistrarAssignment[]>([]);
  const [reports, setReports] = useState<Map<string, SubRegistrarReport>>(new Map());
  const [requests, setRequests] = useState<Map<string, PaymentRequest>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<SubRegistrarAssignment | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('Не получены');
  const [reportData, setReportData] = useState<string>('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await SubRegistrarService.getAssignments();
      setAssignments(response.assignments);
      
      // Load reports for each assignment
      const reportsMap = new Map<string, SubRegistrarReport>();
      const requestsMap = new Map<string, PaymentRequest>();
      
      for (const assignment of response.assignments) {
        try {
          // Load report if exists
          const report = await SubRegistrarService.getReport(assignment.requestId);
          reportsMap.set(assignment.requestId, report);
        } catch (error) {
          // Report doesn't exist yet, that's okay
        }
        
        try {
          // Load request details
          const request = await PaymentRequestService.getById(assignment.requestId);
          if (request) {
            requestsMap.set(assignment.requestId, request);
          }
        } catch (error) {
          console.error('Error loading request:', error);
        }
      }
      
      setReports(reportsMap);
      setRequests(requestsMap);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Ошибка загрузки назначений');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async (assignment: SubRegistrarAssignment) => {
    try {
      setIsSaving(true);
      
      const reportData = {
        requestId: assignment.requestId,
        documentStatus,
        reportData: reportData ? JSON.parse(reportData) : undefined
      };
      
      await SubRegistrarService.saveDraftReport(reportData);
      toast.success('Отчёт сохранён как черновик');
      
      // Reload assignments to get updated data
      await loadAssignments();
      
      if (onReportUpdate) {
        onReportUpdate();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Ошибка сохранения черновика');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishReport = async (assignment: SubRegistrarAssignment) => {
    try {
      setIsPublishing(true);
      
      await SubRegistrarService.publishReport(assignment.requestId);
      
      // Send notifications
      const request = requests.get(assignment.requestId);
      if (request) {
        NotificationService.notifyReportPublished(assignment.requestId, request.requestNumber || 'Без номера');
      }
      
      toast.success('Отчёт опубликован');
      
      // Reload assignments to get updated data
      await loadAssignments();
      
      if (onReportUpdate) {
        onReportUpdate();
      }
    } catch (error) {
      console.error('Error publishing report:', error);
      toast.error('Ошибка публикации отчёта');
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusBadge = (assignment: SubRegistrarAssignment) => {
    const report = reports.get(assignment.requestId);
    
    if (!report) {
      return <Badge variant="outline">Новый</Badge>;
    }
    
    if (report.status === 'draft') {
      return <Badge variant="secondary">Черновик</Badge>;
    }
    
    if (report.status === 'published') {
      return <Badge variant="default">Опубликован</Badge>;
    }
    
    return <Badge variant="outline">{assignment.status}</Badge>;
  };

  const getDocumentStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'Не получены':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Получены в полном объёме':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Частично получены':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDocumentStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'Не получены':
        return 'text-red-600';
      case 'Получены в полном объёме':
        return 'text-green-600';
      case 'Частично получены':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка назначений...</span>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Нет назначений</h3>
          <p className="text-muted-foreground">
            У вас пока нет назначенных заявок для обработки
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Мои назначения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const request = requests.get(assignment.requestId);
              const report = reports.get(assignment.requestId);
              
              return (
                <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Request Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          {request?.requestNumber || `Заявка ${assignment.requestId.slice(0, 8)}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request?.description || 'Описание недоступно'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Сумма:</span>
                          <span className="text-sm">
                            {request?.amount} {request?.currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Статус:</span>
                          {getStatusBadge(assignment)}
                        </div>
                      </div>

                      {/* Document Status */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Статус документов</Label>
                        <div className="flex items-center gap-2">
                          {getDocumentStatusIcon(documentStatus)}
                          <span className={`text-sm ${getDocumentStatusColor(documentStatus)}`}>
                            {documentStatus}
                          </span>
                        </div>
                        
                        <Select
                          value={documentStatus}
                          onValueChange={(value: DocumentStatus) => setDocumentStatus(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Не получены">Не получены</SelectItem>
                            <SelectItem value="Получены в полном объёме">Получены в полном объёме</SelectItem>
                            <SelectItem value="Частично получены">Частично получены</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveDraft(assignment)}
                            disabled={isSaving}
                            className="flex items-center gap-1"
                          >
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Сохранить в работе
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handlePublishReport(assignment)}
                            disabled={isPublishing || !report}
                            className="flex items-center gap-1"
                          >
                            {isPublishing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Опубликовать отчёт
                          </Button>
                        </div>
                        
                        {report && (
                          <div className="text-xs text-muted-foreground">
                            {report.status === 'draft' ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Черновик от {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Опубликован {report.publishedAt && new Date(report.publishedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Report Data */}
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm font-medium">Данные отчёта (JSON)</Label>
                      <textarea
                        value={reportData}
                        onChange={(e) => setReportData(e.target.value)}
                        placeholder="Введите данные отчёта в формате JSON (необязательно)"
                        className="w-full px-3 py-2 border border-input rounded-md text-sm"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
