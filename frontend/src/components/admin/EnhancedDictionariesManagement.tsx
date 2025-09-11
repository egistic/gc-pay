import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { 
  Building2, 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calculator,
  Settings,
  History,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react';
import { useDictionaries } from '../../hooks/useDictionaries';
import { 
  DictionaryType, 
  DictionaryItem
} from '../../types/dictionaries';
import { UserRole } from '../../types';
import { 
  expenseArticleRoleService, 
  ExpenseArticleRoleAssignment,
  ExpenseArticleUserAssignment
} from '../../services/expenseArticleRoleService';
import { AdminService, UserWithRoles } from '../../services/adminService';
import { RoleService, Role } from '../../services/roleService';

interface EnhancedDictionariesManagementProps {
  onBack: () => void;
}

const dictionaryTabs = [
  { 
    id: 'expense-articles', 
    label: 'Статьи расходов', 
    icon: FileText,
    description: 'Управление статьями расходов и их классификацией'
  },
  { 
    id: 'counterparties', 
    label: 'Контрагенты', 
    icon: Building2,
    description: 'База данных контрагентов и поставщиков'
  },
  { 
    id: 'vat-rates', 
    label: 'Ставки НДС', 
    icon: Calculator,
    description: 'Управление ставками НДС'
  },
  { 
    id: 'currencies', 
    label: 'Валюты', 
    icon: Calculator,
    description: 'Справочник валют (только просмотр)'
  },
];

interface DictionaryStats {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  recentlyUpdated: number;
}

export function EnhancedDictionariesManagement({ onBack }: EnhancedDictionariesManagementProps) {
  const [activeTab, setActiveTab] = useState<DictionaryType>('expense-articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingItem, setEditingItemState] = useState<DictionaryItem | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DictionaryStats>({
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    recentlyUpdated: 0
  });
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedItemForAssignment, setSelectedItemForAssignment] = useState<DictionaryItem | null>(null);
  const [itemAssignments, setItemAssignments] = useState<ExpenseArticleUserAssignment[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [createForm, setCreateForm] = useState<any>({});
  const [editForm, setEditForm] = useState<any>({});

  // Use the dictionary hook for the active tab
  const {
    items,
    statistics,
    state,
    searchItems,
    filterItems,
    createItem,
    updateItem,
    deleteItem,
    bulkDelete,
    exportItems,
    importItems,
    selectItem,
    selectAllItems,
    clearSelection,
    setEditingItem,
    setBulkActionMode,
    clearError,
    loadStatistics,
    refresh
  } = useDictionaries(activeTab);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, refresh]);

  // Update stats when statistics change
  useEffect(() => {
    if (statistics) {
      setStats({
        totalItems: statistics.totalItems || 0,
        activeItems: statistics.activeItems || 0,
        inactiveItems: statistics.inactiveItems || 0,
        recentlyUpdated: statistics.recentlyUpdated || 0
      });
    }
  }, [statistics]);

  // Load users and roles for assignment functionality
  useEffect(() => {
    const loadAssignmentData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          AdminService.searchUsers({ limit: 100 }),
          RoleService.getRoles()
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading assignment data:', error);
      }
    };

    loadAssignmentData();
  }, []);

  // Handle tab change
  const handleTabChange = useCallback(async (tabId: string) => {
    setIsLoading(true);
    setError(null);
    setActiveTab(tabId as DictionaryType);
    setSearchQuery('');
    clearSelection();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setShowBulkDialog(false);
    
    try {
      await refresh();
    } catch (err) {
      setError('Ошибка загрузки данных справочника');
      console.error('Error loading dictionary data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clearSelection, refresh]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchItems(query);
    }
  }, [searchItems]);

  // Handle create item
  const handleCreateItem = useCallback(() => {
    setEditingItemState(null);
    setShowCreateDialog(true);
    setError(null);
  }, []);

  // Handle create item form submission
  const handleCreateSubmit = useCallback(async (formData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await createItem(formData);
      setShowCreateDialog(false);
      await refresh();
    } catch (err) {
      setError('Ошибка создания элемента');
      console.error('Error creating item:', err);
    } finally {
      setIsLoading(false);
    }
  }, [createItem, refresh]);

  // Handle edit item
  const handleEditItem = useCallback((item: DictionaryItem) => {
    setEditingItemState(item);
    setEditForm(item);
    setShowEditDialog(true);
    setError(null);
  }, []);

  // Handle delete item
  const handleDeleteItem = useCallback(async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteItem(id);
        await refresh();
      } catch (err) {
        setError('Ошибка удаления элемента');
        console.error('Error deleting item:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [deleteItem, refresh]);


  // Handle edit item submit
  const handleEditSubmit = useCallback(async (itemData: any) => {
    if (!editingItem) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await updateItem(editingItem.id, itemData);
      setShowEditDialog(false);
      setEditingItemState(null);
      setEditForm({});
      await refresh();
    } catch (err) {
      setError('Ошибка обновления элемента');
      console.error('Error updating item:', err);
    } finally {
      setIsLoading(false);
    }
  }, [editingItem, updateItem, refresh]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: string) => {
    if (state.selectedItems.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Вы уверены, что хотите удалить ${state.selectedItems.length} элементов?`)) {
            await bulkDelete(state.selectedItems);
            await refresh();
          }
          break;
        case 'export':
          const blob = await exportItems({ format: 'json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeTab}-export.json`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(`Ошибка выполнения массовой операции: ${action}`);
      console.error('Bulk action failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [state.selectedItems, bulkDelete, exportItems, activeTab, refresh]);

  // Handle assignment functions
  const handleShowAssignments = useCallback(async (item: DictionaryItem) => {
    if (activeTab !== 'expense-articles') return;
    
    setSelectedItemForAssignment(item);
    setAssignmentLoading(true);
    try {
      const assignments = await expenseArticleRoleService.getAssignmentsByExpenseArticle(item.id);
      setItemAssignments([assignments]);
      setShowAssignmentDialog(true);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError('Ошибка загрузки назначений');
    } finally {
      setAssignmentLoading(false);
    }
  }, [activeTab]);

  const handleAssignUser = useCallback(async (userId: string, roleId: string) => {
    if (!selectedItemForAssignment) return;
    
    try {
      await expenseArticleRoleService.createAssignment({
        user_id: userId,
        role_id: roleId,
        expense_article_id: selectedItemForAssignment.id,
        valid_from: new Date().toISOString().split('T')[0]
      });
      // Reload assignments
      const assignments = await expenseArticleRoleService.getAssignmentsByExpenseArticle(selectedItemForAssignment.id);
      setItemAssignments([assignments]);
    } catch (error) {
      console.error('Error assigning user:', error);
      setError('Ошибка назначения пользователя');
    }
  }, [selectedItemForAssignment]);

  const handleRemoveAssignment = useCallback(async (assignmentId: string) => {
    try {
      await expenseArticleRoleService.bulkDeleteAssignments([assignmentId]);
      // Reload assignments
      if (selectedItemForAssignment) {
        const assignments = await expenseArticleRoleService.getAssignmentsByExpenseArticle(selectedItemForAssignment.id);
        setItemAssignments([assignments]);
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      setError('Ошибка удаления назначения');
    }
  }, [selectedItemForAssignment]);

  // Handle import
  const handleImport = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      await importItems(file);
      await refresh();
    } catch (err) {
      setError('Ошибка импорта файла');
      console.error('Import failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [importItems, refresh]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await refresh();
    } catch (err) {
      setError('Ошибка обновления данных');
      console.error('Refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Активный
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Неактивный
      </Badge>
    );
  };

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    const roleLabels = {
      EXECUTOR: 'Исполнитель',
      REGISTRAR: 'Регистратор',
      SUB_REGISTRAR: 'Суб-регистратор',
      DISTRIBUTOR: 'Распорядитель',
      TREASURER: 'Казначей',
      ADMIN: 'Администратор'
    };
    
    const roleColors = {
      EXECUTOR: 'bg-blue-100 text-blue-800',
      REGISTRAR: 'bg-green-100 text-green-800',
      SUB_REGISTRAR: 'bg-emerald-100 text-emerald-800',
      DISTRIBUTOR: 'bg-purple-100 text-purple-800',
      TREASURER: 'bg-orange-100 text-orange-800',
      ADMIN: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  // Render table based on dictionary type
  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Загрузка данных...</span>
          </div>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Ошибка загрузки данных</p>
            <p className="text-sm text-muted-foreground">{state.error}</p>
          </div>
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет данных для отображения</p>
            <Button 
              onClick={handleCreateItem} 
              className="mt-4"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить первый элемент
            </Button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'expense-articles':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                    disabled={isLoading}
                  />
                </TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                  <TableCell>{getStatusBadge(item.is_active)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowAssignments(item)}
                        disabled={isLoading}
                        title="Управление назначениями"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        disabled={isLoading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'counterparties':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                    disabled={isLoading}
                  />
                </TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>БИН/ИИН</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="font-mono">{item.binIin || '-'}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell>{getStatusBadge(item.is_active)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        disabled={isLoading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );


      case 'vat-rates':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                    disabled={isLoading}
                  />
                </TableHead>
                <TableHead>Ставка (%)</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{item.rate}%</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{getStatusBadge(item.is_active)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        disabled={isLoading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'currencies':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                    disabled={isLoading}
                  />
                </TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Масштаб</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.code}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.code)}
                      onChange={() => selectItem(item.code)}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell>{item.scale}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={true}
                        title="Валюты доступны только для просмотра"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={true}
                        title="Валюты доступны только для просмотра"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Неизвестный тип словаря</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Управление справочниками</h2>
          <p className="text-muted-foreground">Централизованное управление всеми справочными данными системы</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleCreateItem} 
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
          {state.selectedItems.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => handleBulkAction('delete')}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить ({state.selectedItems.length})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Обновить
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkDialog(true)} 
            disabled={isLoading || state.selectedItems.length === 0}
          >
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Массовые операции
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowImportExport(true)} 
            disabled={isLoading}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Импорт/Экспорт
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAudit(true)} 
            disabled={isLoading}
          >
            <History className="w-4 h-4 mr-2" />
            Аудит
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего элементов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats.totalItems}
            </div>
            {isLoading && (
              <p className="text-xs text-muted-foreground">Загрузка...</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? '-' : stats.activeItems}
            </div>
            {isLoading && (
              <p className="text-xs text-muted-foreground">Загрузка...</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Неактивных</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? '-' : stats.inactiveItems}
            </div>
            {isLoading && (
              <p className="text-xs text-muted-foreground">Загрузка...</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обновлено за неделю</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats.recentlyUpdated}
            </div>
            {isLoading && (
              <p className="text-xs text-muted-foreground">Загрузка...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search and Filters */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header with Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="search"
                    placeholder="Поиск по названию, коду или описанию..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 pr-4 h-11 bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    disabled={isLoading}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSearch('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filters = {};
                    filterItems(filters);
                  }}
                  className="h-9 px-4 bg-white hover:bg-gray-50 border-gray-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сбросить
                </Button>
                <Button
                  onClick={() => {
                    const filters = {};
                    filterItems(filters);
                  }}
                  className="h-9 px-6 bg-primary hover:bg-primary/90 text-white shadow-sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Поиск
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-end">
              {/* Status Filter for Expense Articles */}
              {activeTab === 'expense-articles' && (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                    Статус
                  </Label>
                  <Select onValueChange={(value: string) => {
                    const filters = { is_active: value === 'active' };
                    filterItems(filters);
                  }}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          Все статусы
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Активные
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Неактивные
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Category Filter for Counterparties */}
              {activeTab === 'counterparties' && (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                    Категория
                  </Label>
                  <Select onValueChange={(value: string) => {
                    const filters = { category: value === 'all' ? undefined : value };
                    filterItems(filters);
                  }}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          Все категории
                        </div>
                      </SelectItem>
                      <SelectItem value="Поставщик СХ">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-500" />
                          Поставщик СХ
                        </div>
                      </SelectItem>
                      <SelectItem value="Элеватор">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          Элеватор
                        </div>
                      </SelectItem>
                      <SelectItem value="Поставщик Услуг">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-orange-500" />
                          Поставщик Услуг
                        </div>
                      </SelectItem>
                      <SelectItem value="Покупатель">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-500" />
                          Покупатель
                        </div>
                      </SelectItem>
                      <SelectItem value="Партнер/БВУ">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          Партнер/БВУ
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rate Filter for VAT Rates */}
              {activeTab === 'vat-rates' && (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Label htmlFor="rate-filter" className="text-sm font-medium text-gray-700">
                    Диапазон ставок
                  </Label>
                  <Select onValueChange={(value: string) => {
                    // Add rate range filtering logic here
                    const filters = {};
                    filterItems(filters);
                  }}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Все ставки" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все ставки</SelectItem>
                      <SelectItem value="0-10">0% - 10%</SelectItem>
                      <SelectItem value="10-20">10% - 20%</SelectItem>
                      <SelectItem value="20+">20% и выше</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

            </div>

            {/* Active Filters and Quick Actions - Combined Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-200">
              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2 items-center">
                {(searchQuery || activeTab === 'expense-articles' || activeTab === 'counterparties') && (
                  <>
                    <span className="text-sm text-gray-500">Активные фильтры:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        <Search className="w-3 h-3 mr-1" />
                        "{searchQuery}"
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearch('')}
                          className="ml-2 h-4 w-4 p-0 hover:bg-blue-300"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const filters = { is_active: true };
                    filterItems(filters);
                  }}
                  className="h-8 px-3 text-xs hover:bg-green-50 hover:text-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Только активные
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const filters = { is_active: false };
                    filterItems(filters);
                  }}
                  className="h-8 px-3 text-xs hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Только неактивные
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const filters = {};
                    filterItems(filters);
                  }}
                  className="h-8 px-3 text-xs hover:bg-gray-50"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Показать все
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dictionary Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex w-full">
          {dictionaryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex items-center gap-2 flex-1"
                disabled={isLoading}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {dictionaryTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTable()}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Массовые операции</DialogTitle>
            <DialogDescription>
              Выберите действие для {state.selectedItems.length} выбранных элементов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите действие" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delete">Удалить</SelectItem>
                <SelectItem value="export">Экспортировать</SelectItem>
                <SelectItem value="activate">Активировать</SelectItem>
                <SelectItem value="deactivate">Деактивировать</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={() => {
                handleBulkAction(bulkAction);
                setShowBulkDialog(false);
              }}
              disabled={!bulkAction || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Выполнить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import/Export Dialog */}
      <Dialog open={showImportExport} onOpenChange={setShowImportExport}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Импорт/Экспорт справочника</DialogTitle>
            <DialogDescription>
              Управление данными справочника "{dictionaryTabs.find(tab => tab.id === activeTab)?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4" />
              <p>Функция импорта/экспорта будет реализована</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Dialog */}
      <Dialog open={showAudit} onOpenChange={setShowAudit}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Аудит справочника</DialogTitle>
            <DialogDescription>
              История изменений и проверка целостности данных для "{dictionaryTabs.find(tab => tab.id === activeTab)?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4" />
              <p>Функция аудита будет реализована</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Назначения пользователей к статье расходов</DialogTitle>
            <DialogDescription>
              Управление назначениями для "{selectedItemForAssignment?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {assignmentLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Загрузка назначений...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Assignments */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Текущие назначения</h3>
                  {itemAssignments.length === 0 || itemAssignments[0]?.assignments?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Назначения не найдены</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {itemAssignments[0]?.assignments?.map((assignment, index) => (
                        <div key={`${assignment.user_id}-${assignment.role_id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-medium">{assignment.user_name}</div>
                              <div className="text-sm text-muted-foreground">{assignment.user_email}</div>
                            </div>
                            <Badge variant="outline">{assignment.role_name}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {new Date(assignment.valid_from).toLocaleDateString('ru-RU')}
                              {assignment.valid_to && ` - ${new Date(assignment.valid_to).toLocaleDateString('ru-RU')}`}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(`${assignment.user_id}-${assignment.role_id}`)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Assignment */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Добавить назначение</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Пользователь</Label>
                      <Select onValueChange={(userId: string) => {
                        const user = users.find(u => u.id === userId);
                        if (user && selectedItemForAssignment) {
                          // Find a default role (you might want to implement role selection)
                          const defaultRole = roles[0];
                          if (defaultRole) {
                            handleAssignUser(userId, defaultRole.id);
                          }
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите пользователя" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Роль</Label>
                      <Select onValueChange={(roleId: string) => {
                        // This would be used if we implement role selection
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name} ({role.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Item Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создание элемента</DialogTitle>
            <DialogDescription>
              Создание нового элемента в справочнике "{dictionaryTabs.find(tab => tab.id === activeTab)?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {activeTab === 'expense-articles' && (
              <>
                <div>
                  <Label htmlFor="create-code">Код</Label>
                  <Input
                    id="create-code"
                    placeholder="Введите код статьи расходов"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-name">Наименование</Label>
                  <Input
                    id="create-name"
                    placeholder="Введите наименование"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-description">Описание</Label>
                  <Input
                    id="create-description"
                    placeholder="Введите описание"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </>
            )}
            {activeTab === 'counterparties' && (
              <>
                <div>
                  <Label htmlFor="create-name">Наименование</Label>
                  <Input
                    id="create-name"
                    placeholder="Введите наименование контрагента"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-tax-id">БИН/ИИН</Label>
                  <Input
                    id="create-tax-id"
                    placeholder="Введите БИН/ИИН"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, tax_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-category">Категория</Label>
                  <Input
                    id="create-category"
                    placeholder="Введите категорию"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </>
            )}
            {activeTab === 'vat-rates' && (
              <>
                <div>
                  <Label htmlFor="create-rate">Ставка (%)</Label>
                  <Input
                    id="create-rate"
                    type="number"
                    step="0.001"
                    placeholder="Введите ставку НДС"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-name">Наименование</Label>
                  <Input
                    id="create-name"
                    placeholder="Введите наименование ставки"
                    onChange={(e) => setCreateForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => handleCreateSubmit(createForm)} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование элемента</DialogTitle>
            <DialogDescription>
              Редактирование элемента в справочнике "{dictionaryTabs.find(tab => tab.id === activeTab)?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {activeTab === 'expense-articles' && editingItem && (
              <>
                <div>
                  <Label htmlFor="edit-code">Код</Label>
                  <Input
                    id="edit-code"
                    defaultValue={editingItem.code}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name">Наименование</Label>
                  <Input
                    id="edit-name"
                    defaultValue={editingItem.name}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Описание</Label>
                  <Input
                    id="edit-description"
                    defaultValue={editingItem.description || ''}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </>
            )}
            {activeTab === 'counterparties' && editingItem && (
              <>
                <div>
                  <Label htmlFor="edit-name">Наименование</Label>
                  <Input
                    id="edit-name"
                    defaultValue={editingItem.name}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-tax-id">БИН/ИИН</Label>
                  <Input
                    id="edit-tax-id"
                    defaultValue={(editingItem as any).tax_id || ''}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, tax_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Категория</Label>
                  <Input
                    id="edit-category"
                    defaultValue={(editingItem as any).category || ''}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </>
            )}
            {activeTab === 'vat-rates' && editingItem && (
              <>
                <div>
                  <Label htmlFor="edit-rate">Ставка (%)</Label>
                  <Input
                    id="edit-rate"
                    type="number"
                    step="0.001"
                    defaultValue={(editingItem as any).rate}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name">Наименование</Label>
                  <Input
                    id="edit-name"
                    defaultValue={editingItem.name}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => handleEditSubmit(editForm)} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}