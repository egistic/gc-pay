import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  DocumentText
} from 'lucide-react';
import { 
  PaymentRequest, 
  SubRegistrarReport, 
  DistributorRequest, 
  ExportContract,
  DocumentStatus 
} from '../../types';

interface WorkflowRequestInformationCardProps {
  request: PaymentRequest;
  subRegistrarReport?: SubRegistrarReport;
  distributorRequests?: DistributorRequest[];
  exportContracts?: ExportContract[];
  showWorkflowData?: boolean;
}

export const WorkflowRequestInformationCard: React.FC<WorkflowRequestInformationCardProps> = ({
  request,
  subRegistrarReport,
  distributorRequests = [],
  exportContracts = [],
  showWorkflowData = true
}) => {
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

  const getDistributionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Ожидает распределения</Badge>;
      case 'distributed':
        return <Badge variant="secondary">Распределено</Badge>;
      case 'report_published':
        return <Badge variant="default">Отчёт опубликован</Badge>;
      case 'export_linked':
        return <Badge variant="default">Контракт привязан</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Информация о заявке
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Request Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Номер заявки</span>
            </div>
            <p className="text-sm">{request.requestNumber || 'Не указан'}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Дата создания</span>
            </div>
            <p className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Сумма</span>
            </div>
            <p className="text-sm font-medium">{request.amount} {request.currency}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Статус</span>
            </div>
            <Badge variant="outline">{request.status}</Badge>
          </div>
        </div>

        {/* Workflow Data */}
        {showWorkflowData && (
          <>
            <Separator />
            
            {/* Distribution Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Статус распределения</h4>
              <div className="flex items-center gap-2">
                {getDistributionStatusBadge(request.distributionStatus || 'pending')}
              </div>
            </div>

            {/* Sub-Registrar Report */}
            {subRegistrarReport && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DocumentText className="h-4 w-4" />
                  Отчёт суб-регистратора
                </h4>
                
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    {getDocumentStatusIcon(subRegistrarReport.documentStatus)}
                    <span className={`text-sm font-medium ${getDocumentStatusColor(subRegistrarReport.documentStatus)}`}>
                      {subRegistrarReport.documentStatus}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Статус отчёта:</span>
                    <Badge variant={subRegistrarReport.status === 'published' ? 'default' : 'secondary'}>
                      {subRegistrarReport.status === 'published' ? 'Опубликован' : 'Черновик'}
                    </Badge>
                  </div>
                  
                  {subRegistrarReport.publishedAt && (
                    <div className="text-xs text-muted-foreground">
                      Опубликован: {new Date(subRegistrarReport.publishedAt).toLocaleString()}
                    </div>
                  )}
                  
                  {subRegistrarReport.reportData && (
                    <div className="text-xs text-muted-foreground">
                      <details>
                        <summary className="cursor-pointer">Дополнительные данные</summary>
                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                          {JSON.stringify(subRegistrarReport.reportData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Distributor Requests */}
            {distributorRequests.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Заявки распорядителя
                </h4>
                
                <div className="space-y-2">
                  {distributorRequests.map((distRequest, index) => (
                    <div key={distRequest.id} className="bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Заявка {index + 1} - {distRequest.amount} {request.currency}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {distRequest.id.slice(0, 8)}
                          </div>
                        </div>
                        <Badge variant={distRequest.status === 'LINKED' ? 'default' : 'outline'}>
                          {distRequest.status === 'LINKED' ? 'Привязан' : 'Ожидает'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Contracts */}
            {exportContracts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Экспортные контракты
                </h4>
                
                <div className="space-y-2">
                  {exportContracts.map((contract) => (
                    <div key={contract.id} className="bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{contract.contractNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(contract.contractDate).toLocaleDateString()}
                            {contract.amount && ` • ${contract.amount} ${contract.currencyCode}`}
                          </div>
                        </div>
                        <Badge variant={contract.isActive ? 'default' : 'secondary'}>
                          {contract.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Request Description */}
        {request.description && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Описание</h4>
              <p className="text-sm text-muted-foreground">{request.description}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
