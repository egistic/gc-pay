import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, FileText, Link, Eye, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { DistributorWorkflowService } from '../../services/distributorWorkflowService';
import { ExportContractsService } from '../../services/exportContractsService';
import { NotificationService } from '../../services/notificationService';
import { WorkflowStateService } from '../../services/workflowStateService';
import { 
  DistributorRequest, 
  ExportContract, 
  DistributorExportLink 
} from '../../types';
import { toast } from 'sonner';

interface DistributorWorkflowRequestsListProps {
  onRequestUpdate?: () => void;
}

export const DistributorWorkflowRequestsList: React.FC<DistributorWorkflowRequestsListProps> = ({
  onRequestUpdate
}) => {
  const [requests, setRequests] = useState<DistributorRequest[]>([]);
  const [exportContracts, setExportContracts] = useState<ExportContract[]>([]);
  const [enrichedData, setEnrichedData] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DistributorRequest | null>(null);
  const [selectedContract, setSelectedContract] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [requestsResponse, contractsResponse] = await Promise.all([
        DistributorWorkflowService.getDistributorRequests(),
        ExportContractsService.getExportContracts()
      ]);
      
      setRequests(requestsResponse.requests);
      setExportContracts(contractsResponse.contracts);
      
      // Load enriched data for each request
      const enrichedMap = new Map<string, any>();
      for (const request of requestsResponse.requests) {
        try {
          const enriched = await DistributorWorkflowService.getEnrichedRequest(request.id);
          enrichedMap.set(request.id, enriched);
        } catch (error) {
          console.error('Error loading enriched data for request:', request.id, error);
        }
      }
      setEnrichedData(enrichedMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkContract = async (request: DistributorRequest) => {
    if (!selectedContract) {
      toast.error('Выберите экспортный контракт');
      return;
    }

    try {
      setIsLinking(true);
      
      await DistributorWorkflowService.linkExportContract(request.id, {
        exportContractId: selectedContract
      });
      
      // Send notification
      const contract = exportContracts.find(c => c.id === selectedContract);
      if (contract) {
        NotificationService.notifyExportContractLinked(request.id, `Заявка ${request.id.slice(0, 8)}`, contract.contractNumber);
      }
      
      toast.success('Экспортный контракт успешно привязан');
      
      // Reload data
      await loadData();
      
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } catch (error) {
      console.error('Error linking contract:', error);
      toast.error('Ошибка привязки контракта');
    } finally {
      setIsLinking(false);
      setSelectedRequest(null);
      setSelectedContract('');
    }
  };

  const getStatusBadge = (request: DistributorRequest) => {
    switch (request.status) {
      case 'PENDING':
        return <Badge variant="outline">Ожидает</Badge>;
      case 'LINKED':
        return <Badge variant="default">Привязан</Badge>;
      default:
        return <Badge variant="secondary">{request.status}</Badge>;
    }
  };

  const getEnrichedStatus = (request: DistributorRequest) => {
    const enriched = enrichedData.get(request.id);
    if (!enriched) return null;
    
    if (enriched.subRegistrarReport) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Обогащён данными от суб-регистратора</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <Clock className="h-4 w-4" />
        <span>Ожидает отчёта от суб-регистратора</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка заявок...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Нет заявок</h3>
          <p className="text-muted-foreground">
            У вас пока нет заявок для обработки
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
            Мои заявки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => {
              const enriched = enrichedData.get(request.id);
              const isLinked = request.status === 'LINKED';
              
              return (
                <Card key={request.id} className={`border-l-4 ${isLinked ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Request Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          Заявка {request.id.slice(0, 8)}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Сумма:</span>
                          <span className="text-sm">{request.amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Статус:</span>
                          {getStatusBadge(request)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Создано: {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Enriched Data Status */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Статус обогащения</Label>
                        {getEnrichedStatus(request)}
                        
                        {enriched?.subRegistrarReport && (
                          <div className="text-xs text-muted-foreground">
                            <div>Статус документов: {enriched.subRegistrarReport.documentStatus}</div>
                            <div>Отчёт: {enriched.subRegistrarReport.status === 'published' ? 'Опубликован' : 'Черновик'}</div>
                          </div>
                        )}
                      </div>

                      {/* Export Contract Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Экспортный контракт</Label>
                        {isLinked ? (
                          <div className="text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Привязан
                          </div>
                        ) : (
                          <Select
                            value={selectedContract}
                            onValueChange={setSelectedContract}
                            disabled={!enriched?.subRegistrarReport}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите контракт" />
                            </SelectTrigger>
                            <SelectContent>
                              {exportContracts.map((contract) => (
                                <SelectItem key={contract.id} value={contract.id}>
                                  {contract.contractNumber} - {contract.contractDate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLinkContract(request)}
                            disabled={isLinking || isLinked || !enriched?.subRegistrarReport || !selectedContract}
                            className="flex items-center gap-1"
                          >
                            {isLinking ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Link className="h-3 w-3" />
                            )}
                            Привязать контракт
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Подробнее
                          </Button>
                        </div>
                        
                        {enriched?.exportLinks && enriched.exportLinks.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <div>Привязанных контрактов: {enriched.exportLinks.length}</div>
                            <div>Последняя привязка: {new Date(enriched.exportLinks[0].linkedAt).toLocaleDateString()}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    {enriched?.subRegistrarReport && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <h5 className="text-sm font-medium mb-2">Данные от суб-регистратора</h5>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Статус документов: {enriched.subRegistrarReport.documentStatus}</div>
                          <div>Статус отчёта: {enriched.subRegistrarReport.status === 'published' ? 'Опубликован' : 'Черновик'}</div>
                          {enriched.subRegistrarReport.publishedAt && (
                            <div>Дата публикации: {new Date(enriched.subRegistrarReport.publishedAt).toLocaleDateString()}</div>
                          )}
                          {enriched.subRegistrarReport.reportData && (
                            <div>Дополнительные данные: {JSON.stringify(enriched.subRegistrarReport.reportData)}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Card className="fixed inset-4 z-50 bg-background border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Детали заявки</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Закрыть
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">ID заявки</Label>
                <p className="text-sm">{selectedRequest.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Сумма</Label>
                <p className="text-sm">{selectedRequest.amount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Статус</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Дата создания</Label>
                <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
