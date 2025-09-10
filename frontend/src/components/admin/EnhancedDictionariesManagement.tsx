import React, { useState, useCallback } from 'react';
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
import { 
  BookOpen, 
  Building2, 
  FileText, 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calculator,
  Settings
} from 'lucide-react';
import { useDictionaries } from '../../hooks/useDictionaries';
import { 
  DictionaryType, 
  DictionaryItem,
  ExpenseItemDictionary,
  CounterpartyDictionary,
  ContractDictionary,
  NormativeDictionary,
  PriorityDictionary,
  UserDictionary
} from '../../types/dictionaries';
import { UserRole } from '../../types';

interface EnhancedDictionariesManagementProps {
  onBack: () => void;
}

const dictionaryTabs = [
  { 
    id: 'expense-items', 
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
    id: 'contracts', 
    label: 'Контракты', 
    icon: BookOpen,
    description: 'Договоры и соглашения с контрагентами'
  },
  { 
    id: 'normatives', 
    label: 'Нормативы', 
    icon: Calculator,
    description: 'Лимиты и нормативы по статьям расходов'
  },
  { 
    id: 'priorities', 
    label: 'Приоритеты', 
    icon: AlertTriangle,
    description: 'Приоритеты платежей и операций'
  },
  { 
    id: 'users', 
    label: 'Пользователи', 
    icon: Users,
    description: 'Управление пользователями и ролями'
  },
];

export function EnhancedDictionariesManagement({ onBack }: EnhancedDictionariesManagementProps) {
  const [activeTab, setActiveTab] = useState<DictionaryType>('expense-items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingItem, setEditingItemState] = useState<DictionaryItem | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');

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
    clearError
  } = useDictionaries(activeTab);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as DictionaryType);
    setSearchQuery('');
    clearSelection();
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setShowBulkDialog(false);
  }, [clearSelection]);

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
  }, []);

  // Handle edit item
  const handleEditItem = useCallback((item: DictionaryItem) => {
    setEditingItemState(item);
    setShowEditDialog(true);
  }, []);

  // Handle delete item
  const handleDeleteItem = useCallback(async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      await deleteItem(id);
    }
  }, [deleteItem]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: string) => {
    if (state.selectedItems.length === 0) return;

    switch (action) {
      case 'delete':
        if (window.confirm(`Вы уверены, что хотите удалить ${state.selectedItems.length} элементов?`)) {
          await bulkDelete(state.selectedItems);
        }
        break;
      case 'export':
        try {
          const blob = await exportItems({ format: 'json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeTab}-export.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Export failed:', error);
        }
        break;
      default:
        break;
    }
  }, [state.selectedItems, bulkDelete, exportItems, activeTab]);

  // Handle import
  const handleImport = useCallback(async (file: File) => {
    try {
      await importItems(file);
      // Refresh the data
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [importItems]);

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
      executor: 'Исполнитель',
      registrar: 'Регистратор',
      distributor: 'Распорядитель',
      treasurer: 'Казначей',
      admin: 'Администратор'
    };
    
    const roleColors = {
      executor: 'bg-blue-100 text-blue-800',
      registrar: 'bg-green-100 text-green-800',
      distributor: 'bg-purple-100 text-purple-800',
      treasurer: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  // Render table based on dictionary type
  const renderTable = () => {
    switch (activeTab) {
      case 'expense-items':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                  />
                </TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Роль владельца</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: ExpenseItemDictionary) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{getRoleBadge(item.ownerRole)}</TableCell>
                  <TableCell>{getStatusBadge(item.isActive)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
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
                  />
                </TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Сокращение</TableHead>
                <TableHead>БИН/ИИН</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: CounterpartyDictionary) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.abbreviation}</TableCell>
                  <TableCell className="font-mono">{item.binIin}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{getStatusBadge(item.isActive)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
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

      case 'contracts':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                  />
                </TableHead>
                <TableHead>Код контракта</TableHead>
                <TableHead>Контрагент</TableHead>
                <TableHead>Статья расходов</TableHead>
                <TableHead>Лимит</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: ContractDictionary) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell>{item.counterpartyId}</TableCell>
                  <TableCell>{item.expenseItemId}</TableCell>
                  <TableCell>{item.limitTotal.toLocaleString()} ₸</TableCell>
                  <TableCell>
                    <Badge className={
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {item.status === 'active' ? 'Активный' :
                       item.status === 'completed' ? 'Завершен' : 'Отменен'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
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

      case 'priorities':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                  />
                </TableHead>
                <TableHead>Ранг</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Цвет</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: PriorityDictionary) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell>{item.rank}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.ruleDescription}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
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

      case 'users':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === items.length && items.length > 0}
                    onChange={selectAllItems}
                  />
                </TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Текущая роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: UserDictionary) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(item.id)}
                      onChange={() => selectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.roles.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(item.currentRole)}</TableCell>
                  <TableCell>{getStatusBadge(item.isActive)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
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
        return <div>Неизвестный тип словаря</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="pl-0">
            ← Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Управление справочниками</h1>
            <p className="text-muted-foreground">
              Централизованное управление всеми справочными данными системы
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Массовые операции
          </Button>
          <Button onClick={handleCreateItem}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего элементов</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.activeItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Неактивных</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.inactiveItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Обновлено за неделю</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.recentlyUpdated}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Фильтры
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Импорт
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dictionary Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6">
          {dictionaryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
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
                {state.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Загрузка...</div>
                  </div>
                ) : state.error ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-red-600">Ошибка: {state.error}</div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Нет данных</div>
                  </div>
                ) : (
                  renderTable()
                )}
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
              disabled={!bulkAction}
            >
              Выполнить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
