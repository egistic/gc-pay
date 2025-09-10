import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  History, 
  Search, 
  Filter,
  CalendarDays,
  User,
  Building,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DistributorBinding, ExpenseItem, User as UserType } from '../../types';
import { DistributorService, ApiDictionaryService, UserService } from '../../services/api';
import { toast } from 'sonner@2.0.3';

interface DistributorRoutingProps {
  onBack?: () => void;
}

export function DistributorRouting({ onBack }: DistributorRoutingProps = {}) {
  const [bindings, setBindings] = useState<DistributorBinding[]>([]);
  const [filteredBindings, setFilteredBindings] = useState<DistributorBinding[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpenseItem, setSelectedExpenseItem] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Справочники
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [distributors, setDistributors] = useState<UserType[]>([]);
  
  // Диалоги
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBinding, setEditingBinding] = useState<DistributorBinding | null>(null);
  
  // Форма
  const [formData, setFormData] = useState({
    expenseItemId: '',
    chiefDistributorUserId: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bindings, searchTerm, selectedExpenseItem, selectedDistributor, showActiveOnly, currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [bindingsData, expenseItemsData, usersData] = await Promise.all([
        DistributorService.getBindings(),
        ApiDictionaryService.getExpenseItems(),
        UserService.getUsers()
      ]);
      
      setBindings(bindingsData);
      setExpenseItems(expenseItemsData);
      setUsers(usersData);
      
      // Фильтруем пользователей с ролью распорядителя
      const distributorUsers = usersData.filter(user => 
        user.roles.includes('distributor')
      );
      setDistributors(distributorUsers);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bindings];

    // Фильтр по поисковому запросу
    if (searchTerm) {
      filtered = filtered.filter(binding =>
        getExpenseItemName(binding.expenseItemId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDistributorName(binding.chiefDistributorUserId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по статье расходов
    if (selectedExpenseItem && selectedExpenseItem !== 'all') {
      filtered = filtered.filter(binding => binding.expenseItemId === selectedExpenseItem);
    }

    // Фильтр по распорядителю
    if (selectedDistributor && selectedDistributor !== 'all') {
      filtered = filtered.filter(binding => binding.chiefDistributorUserId === selectedDistributor);
    }

    // Фильтр по активности
    if (showActiveOnly) {
      filtered = filtered.filter(binding => binding.isActive);
    }

    // Фильтр по текущей дате (действующие на указанную дату)
    if (currentDate) {
      const filterDate = new Date(currentDate);
      filtered = filtered.filter(binding => {
        const fromDate = new Date(binding.effectiveFrom);
        const toDate = binding.effectiveTo ? new Date(binding.effectiveTo) : new Date('2099-12-31');
        return filterDate >= fromDate && filterDate <= toDate;
      });
    }

    setFilteredBindings(filtered);
  };

  const getExpenseItemName = (id: string) => {
    const item = expenseItems.find(e => e.id === id);
    return item?.name || 'Неизвестно';
  };

  const getDistributorName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user?.name || 'Неизвестно';
  };

  const resetForm = () => {
    setFormData({
      expenseItemId: '',
      chiefDistributorUserId: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isActive: true
    });
  };

  const handleCreate = async () => {
    if (!formData.expenseItemId || !formData.chiefDistributorUserId) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const newBinding = await DistributorService.createBinding(formData);
      setBindings([newBinding, ...bindings]);
      setShowCreateDialog(false);
      resetForm();
      toast.success('Привязка создана успешно');
    } catch (error) {
      console.error('Failed to create binding:', error);
      toast.error('Ошибка создания привязки');
    }
  };

  const handleEdit = (binding: DistributorBinding) => {
    setEditingBinding(binding);
    setFormData({
      expenseItemId: binding.expenseItemId,
      chiefDistributorUserId: binding.chiefDistributorUserId,
      effectiveFrom: binding.effectiveFrom,
      effectiveTo: binding.effectiveTo || '',
      isActive: binding.isActive
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingBinding || !formData.expenseItemId || !formData.chiefDistributorUserId) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const updatedBinding = await DistributorService.updateBinding(editingBinding.id, formData);
      setBindings(bindings.map(b => b.id === editingBinding.id ? updatedBinding : b));
      setShowEditDialog(false);
      setEditingBinding(null);
      resetForm();
      toast.success('Привязка обновлена успешно');
    } catch (error) {
      console.error('Failed to update binding:', error);
      toast.error('Ошибка обновления привязки');
    }
  };

  const handleToggleActive = async (binding: DistributorBinding) => {
    try {
      const updatedBinding = await DistributorService.updateBinding(binding.id, {
        ...binding,
        isActive: !binding.isActive
      });
      setBindings(bindings.map(b => b.id === binding.id ? updatedBinding : b));
      toast.success(`Привязка ${updatedBinding.isActive ? 'активирована' : 'деактивирована'}`);
    } catch (error) {
      console.error('Failed to toggle binding:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleDelete = async (binding: DistributorBinding) => {
    if (!confirm('Вы уверены, что хотите удалить эту привязку?')) {
      return;
    }

    try {
      await DistributorService.deleteBinding(binding.id);
      setBindings(bindings.filter(b => b.id !== binding.id));
      toast.success('Привязка удалена');
    } catch (error) {
      console.error('Failed to delete binding:', error);
      toast.error('Ошибка удаления привязки');
    }
  };

  const buildExpenseTree = (items: ExpenseItem[], parentId?: string): ExpenseItem[] => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildExpenseTree(items, item.id)
      }));
  };

  const renderExpenseOptions = (items: ExpenseItem[], level = 0): JSX.Element[] => {
    return items.flatMap(item => [
      <SelectItem key={item.id} value={item.id}>
        {'  '.repeat(level) + item.name}
      </SelectItem>,
      ...(item.children ? renderExpenseOptions(item.children, level + 1) : [])
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="pl-0">
              ← Назад
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-semibold">Маршрутизация распорядителей</h2>
            <p className="text-muted-foreground">
              Назначение главных распорядителей к статьям расходов
            </p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Создать привязку
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Создание привязки</DialogTitle>
              <DialogDescription>
                Назначьте главного распорядителя для статьи расходов
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Статья расходов *</Label>
                <Select
                  value={formData.expenseItemId}
                  onValueChange={(value) => setFormData({...formData, expenseItemId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статью" />
                  </SelectTrigger>
                  <SelectContent>
                    {renderExpenseOptions(buildExpenseTree(expenseItems))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Главный распорядитель *</Label>
                <Select
                  value={formData.chiefDistributorUserId}
                  onValueChange={(value) => setFormData({...formData, chiefDistributorUserId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите распорядителя" />
                  </SelectTrigger>
                  <SelectContent>
                    {distributors.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Действует с</Label>
                  <Input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({...formData, effectiveFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Действует до</Label>
                  <Input
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(e) => setFormData({...formData, effectiveTo: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Активна</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Отмена
              </Button>
              <Button onClick={handleCreate}>
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Поиск */}
            <div className="space-y-2">
              <Label>Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Статья или распорядитель..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Статья расходов */}
            <div className="space-y-2">
              <Label>Статья расходов</Label>
              <Select value={selectedExpenseItem} onValueChange={setSelectedExpenseItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статьи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статьи</SelectItem>
                  {renderExpenseOptions(buildExpenseTree(expenseItems))}
                </SelectContent>
              </Select>
            </div>

            {/* Распорядитель */}
            <div className="space-y-2">
              <Label>Распорядитель</Label>
              <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                <SelectTrigger>
                  <SelectValue placeholder="Все распорядители" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все распорядители</SelectItem>
                  {distributors.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Дата фильтра */}
            <div className="space-y-2">
              <Label>Действующие на дату</Label>
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <Switch
              id="activeOnly"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
            <Label htmlFor="activeOnly">Только активные</Label>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Активные привязки</p>
                <p className="text-2xl font-semibold">
                  {bindings.filter(b => b.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Главных распорядителей</p>
                <p className="text-2xl font-semibold">
                  {new Set(bindings.filter(b => b.isActive).map(b => b.chiefDistributorUserId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Закрепленных статей</p>
                <p className="text-2xl font-semibold">
                  {new Set(bindings.filter(b => b.isActive).map(b => b.expenseItemId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица привязок */}
      <Card>
        <CardHeader>
          <CardTitle>
            Привязки ({filteredBindings.length} из {bindings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статья расходов</TableHead>
                <TableHead>Главный распорядитель</TableHead>
                <TableHead>Период действия</TableHead>
                <TableHead className="text-center">Статус</TableHead>
                <TableHead className="w-[150px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBindings.map((binding) => (
                <TableRow key={binding.id}>
                  <TableCell>
                    <div className="font-medium">
                      {getExpenseItemName(binding.expenseItemId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{getDistributorName(binding.chiefDistributorUserId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(binding.effectiveFrom).toLocaleDateString('ru-RU')}
                        {binding.effectiveTo && (
                          <>
                            {' - '}
                            {new Date(binding.effectiveTo).toLocaleDateString('ru-RU')}
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={binding.isActive ? "default" : "secondary"}>
                      {binding.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(binding)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(binding)}
                        className="h-8 w-8 p-0"
                      >
                        {binding.isActive ? (
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(binding)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBindings.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>Привязки не найдены</p>
              <p className="text-sm mt-2">
                Попробуйте изменить фильтры или создать новую привязку
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование привязки</DialogTitle>
            <DialogDescription>
              Изменение параметров привязки распорядителя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Статья расходов *</Label>
              <Select
                value={formData.expenseItemId}
                onValueChange={(value) => setFormData({...formData, expenseItemId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статью" />
                </SelectTrigger>
                <SelectContent>
                  {renderExpenseOptions(buildExpenseTree(expenseItems))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Главный распорядитель *</Label>
              <Select
                value={formData.chiefDistributorUserId}
                onValueChange={(value) => setFormData({...formData, chiefDistributorUserId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите распорядителя" />
                </SelectTrigger>
                <SelectContent>
                  {distributors.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Действует с</Label>
                <Input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({...formData, effectiveFrom: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Действует до</Label>
                <Input
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData({...formData, effectiveTo: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActiveEdit"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActiveEdit">Активна</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingBinding(null);
              resetForm();
            }}>
              Отмена
            </Button>
            <Button onClick={handleUpdate}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}