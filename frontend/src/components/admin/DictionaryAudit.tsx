import React, { useState, useEffect, useCallback } from 'react';
import { DictionaryAuditService } from '../../services/dictionaryAuditService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  History, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  FileText,
  Database,
  Shield
} from 'lucide-react';
import { DictionaryType } from '../../types/dictionaries';

interface DictionaryAuditProps {
  dictionaryType: DictionaryType;
  onBack: () => void;
}

interface AuditEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes?: Record<string, { old: any; new: any }>;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface DataIntegrityIssue {
  id: string;
  type: 'orphaned' | 'duplicate' | 'invalid' | 'missing';
  severity: 'low' | 'medium' | 'high';
  itemId: string;
  itemName: string;
  description: string;
  suggestion?: string;
  affectedFields?: string[];
}

interface AuditStatistics {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  recentActivity: number;
  dataIntegrityIssues: number;
}

export function DictionaryAudit({ dictionaryType, onBack }: DictionaryAuditProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [dataIntegrityIssues, setDataIntegrityIssues] = useState<DataIntegrityIssue[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'integrity'>('history');

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

  const actionLabels: Record<string, string> = {
    create: 'Создание',
    update: 'Обновление',
    delete: 'Удаление',
    import: 'Импорт',
    export: 'Экспорт'
  };

  const severityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const actionIcons: Record<string, React.ComponentType<any>> = {
    create: CheckCircle,
    update: RefreshCw,
    delete: XCircle,
    import: Download,
    export: Download
  };

  // Load audit data
  useEffect(() => {
    loadAuditData();
  }, [dictionaryType, selectedAction, selectedUser, dateRange]);

  const loadAuditData = useCallback(async () => {
    setLoading(true);
    try {
      // Load audit history
      const historyResponse = await DictionaryAuditService.getAuditHistory(dictionaryType, {
        start_date: dateRange.start,
        end_date: dateRange.end,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        user_id: selectedUser !== 'all' ? selectedUser : undefined,
        page: 1,
        limit: 100
      });

      // Load statistics
      const statistics = await DictionaryAuditService.getAuditStatistics(dictionaryType);

      // Load integrity issues
      const integrityResponse = await DictionaryAuditService.getDataIntegrityIssues(dictionaryType);

      setAuditEntries(historyResponse.entries);
      setDataIntegrityIssues(integrityResponse.issues);
      setStatistics(statistics);
      
    } catch (error) {
      console.error('Error loading audit data:', error);
      // Set empty data on error
      setAuditEntries([]);
      setDataIntegrityIssues([]);
      setStatistics({
        total_actions: 0,
        actions_by_type: {},
        actions_by_user: {},
        recent_activity: 0,
        data_integrity_issues: 0
      });
    } finally {
      setLoading(false);
    }
  }, [dictionaryType, selectedAction, selectedUser, dateRange]);

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || entry.action === selectedAction;
    const matchesUser = selectedUser === 'all' || entry.userId === selectedUser;
    
    const entryDate = new Date(entry.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const matchesDate = entryDate >= startDate && entryDate <= endDate;
    
    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const handleViewDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setShowDetailsDialog(true);
  };

  const exportAuditLog = () => {
    const csvContent = [
      ['Дата', 'Действие', 'Элемент', 'Пользователь', 'Детали', 'IP адрес'],
      ...filteredEntries.map(entry => [
        new Date(entry.timestamp).toLocaleString('ru-RU'),
        actionLabels[entry.action],
        entry.itemName,
        entry.userName,
        entry.details || '',
        entry.ipAddress || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${dictionaryType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Аудит справочника</h2>
          <p className="text-muted-foreground">
            История изменений и проверка целостности данных для "{dictionaryLabels[dictionaryType]}"
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего действий</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Недавняя активность</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.recentActivity}</div>
              <p className="text-xs text-muted-foreground">за последние 24 часа</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Проблемы целостности</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.dataIntegrityIssues}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Проверка данных</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dataIntegrityIssues.filter(issue => issue.severity === 'high').length === 0 ? 'OK' : 'Внимание'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="history">История изменений</TabsTrigger>
          <TabsTrigger value="integrity">Целостность данных</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фильтры
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Поиск</Label>
                  <Input
                    id="search"
                    placeholder="Поиск по элементу или пользователю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="action-filter">Действие</Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все действия</SelectItem>
                      {Object.entries(actionLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user-filter">Пользователь</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все пользователи</SelectItem>
                      {Array.from(new Set(auditEntries.map(e => e.userId))).map(userId => {
                        const user = auditEntries.find(e => e.userId === userId);
                        return (
                          <SelectItem key={userId} value={userId}>
                            {user?.userName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={exportAuditLog} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>История изменений ({filteredEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Загрузка истории...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Действие</TableHead>
                      <TableHead>Элемент</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Детали</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map(entry => {
                      const ActionIcon = actionIcons[entry.action];
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {new Date(entry.timestamp).toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ActionIcon className="h-4 w-4" />
                              <Badge variant="outline">
                                {actionLabels[entry.action]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.itemName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {entry.userName}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.details}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(entry)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          {/* Data Integrity Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Проблемы целостности данных ({dataIntegrityIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataIntegrityIssues.map(issue => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={severityColors[issue.severity]}>
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{issue.type}</Badge>
                        </div>
                        <h4 className="font-medium">{issue.itemName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {issue.description}
                        </p>
                        {issue.suggestion && (
                          <p className="text-sm text-blue-600">
                            <strong>Рекомендация:</strong> {issue.suggestion}
                          </p>
                        )}
                        {issue.affectedFields && (
                          <div className="flex flex-wrap gap-1">
                            {issue.affectedFields.map(field => (
                              <Badge key={field} variant="secondary" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали действия</DialogTitle>
            <DialogDescription>
              Подробная информация о выбранном действии
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Действие</Label>
                  <p className="text-sm">{actionLabels[selectedEntry.action]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Дата</Label>
                  <p className="text-sm">
                    {new Date(selectedEntry.timestamp).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Элемент</Label>
                  <p className="text-sm">{selectedEntry.itemName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Пользователь</Label>
                  <p className="text-sm">{selectedEntry.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP адрес</Label>
                  <p className="text-sm">{selectedEntry.ipAddress || 'Не указан'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-sm text-xs break-all">
                    {selectedEntry.userAgent || 'Не указан'}
                  </p>
                </div>
              </div>

              {selectedEntry.details && (
                <div>
                  <Label className="text-sm font-medium">Детали</Label>
                  <p className="text-sm">{selectedEntry.details}</p>
                </div>
              )}

              {selectedEntry.changes && (
                <div>
                  <Label className="text-sm font-medium">Изменения</Label>
                  <div className="space-y-2">
                    {Object.entries(selectedEntry.changes).map(([field, change]) => (
                      <div key={field} className="border rounded p-2">
                        <div className="text-sm font-medium">{field}</div>
                        <div className="text-sm text-red-600">
                          Было: {String(change.old)}
                        </div>
                        <div className="text-sm text-green-600">
                          Стало: {String(change.new)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
