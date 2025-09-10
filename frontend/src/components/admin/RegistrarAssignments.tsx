import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';
import { CalendarDays, ChevronDown, ChevronRight, Download, Edit, FileSpreadsheet, History, MoreHorizontal, Plus, Search, Trash2, Upload, Users, Eye, Copy, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useDictionaries } from '../../hooks/useDictionaries';

interface RegistrarAssignment {
  id: string;
  expenseItemId: string;
  expenseItemCode: string;
  expenseItemName: string;
  expenseItemPath: string;
  orgUnitId?: string;
  orgUnitName?: string;
  registrarPosition: string;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'archived';
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface ExpenseItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  ownerRole: string;
}

interface OrgUnit {
  id: string;
  name: string;
  parentId?: string;
  children?: OrgUnit[];
  level: number;
}

interface ResponsibleAssignment {
  expenseItemId: string;
  expenseItemName: string;
  orgUnitId?: string;
  orgUnitName?: string;
  registrarName: string;
  registrarPosition: string;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

// Expense items will be loaded from dictionary service

const mockOrgUnits: OrgUnit[] = [
  { id: '1', name: 'Головной офис', level: 0, children: [
    { id: '1.1', name: 'Финансовый департамент', parentId: '1', level: 1 },
    { id: '1.2', name: 'Коммерческий департамент', parentId: '1', level: 1 }
  ]},
  { id: '2', name: 'Элеватор Алматы', level: 0 },
  { id: '3', name: 'Элеватор Астана', level: 0 }
];

const registrarPositions = [
  'Ведущий специалист по учету',
  'Специалист по учету',
  'Бухгалтер-аналитик',
  'Старший бухгалтер',
  'Главный бухгалтер'
];

const mockAssignments: RegistrarAssignment[] = [
  {
    id: '1',
    expenseItemId: '1',
    expenseItemCode: '001',
    expenseItemName: 'Закуп товара (EXW)',
    expenseItemPath: '001 Закуп товара (EXW)',
    orgUnitId: '1.1',
    orgUnitName: 'Финансовый департамент',
    registrarPosition: 'Ведущий специалист по учету',
    priority: 1,
    effectiveFrom: '2025-01-01',
    effectiveTo: '2025-12-31',
    status: 'active',
    createdBy: 'admin',
    createdByName: 'Администратор',
    createdAt: '2025-12-01T10:00:00Z'
  },
  {
    id: '2',
    expenseItemId: '4',
    expenseItemCode: '004',
    expenseItemName: 'Автомобильные перевозки',
    expenseItemPath: '004 Автомобильные перевозки',
    registrarPosition: 'Бухгалтер-аналитик',
    priority: 2,
    effectiveFrom: '2025-07-01',
    status: 'active',
    createdBy: 'admin',
    createdByName: 'Администратор',
    createdAt: '2025-11-15T14:30:00Z'
  },
  {
    id: '3',
    expenseItemId: '6',
    expenseItemCode: '006',
    expenseItemName: 'Лабораторные услуги',
    expenseItemPath: '006 Лабораторные услуги',
    orgUnitId: '1.2',
    orgUnitName: 'Коммерческий департамент',
    registrarPosition: 'Специалист по учету',
    priority: 1,
    effectiveFrom: '2025-01-01',
    status: 'active',
    createdBy: 'admin',
    createdByName: 'Администратор',
    createdAt: '2025-11-20T09:15:00Z'
  }
];

interface RegistrarAssignmentsProps {
  onBack?: () => void;
}

export function RegistrarAssignments({ onBack }: RegistrarAssignmentsProps = {}) {

  // Get dictionary data
  const { items: expenseItems } = useDictionaries('expense-articles');
  const [assignments, setAssignments] = useState<RegistrarAssignment[]>(mockAssignments);
  const [filteredAssignments, setFilteredAssignments] = useState<RegistrarAssignment[]>(mockAssignments);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResponsibleDialog, setShowResponsibleDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<RegistrarAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    expenseItem: '',
    orgUnit: '',
    status: 'all',
    position: 'all-positions',
    effectiveDate: new Date()
  });

  // Form state
  const [formData, setFormData] = useState({
    expenseItemId: '',
    orgUnitId: 'all-units',
    registrarPosition: '',
    priority: 1,
    effectiveFrom: new Date(),
    effectiveTo: null as Date | null
  });

  // Responsible lookup state
  const [responsibleFilters, setResponsibleFilters] = useState({
    expenseItemId: '',
    orgUnitId: 'all-units',
    asOfDate: new Date()
  });
  const [responsibleAssignments, setResponsibleAssignments] = useState<ResponsibleAssignment[]>([]);

  // Filter assignments
  useEffect(() => {
    let filtered = assignments.filter(assignment => {
      if (filters.status !== 'all' && assignment.status !== filters.status) return false;
      if (filters.expenseItem && !assignment.expenseItemPath.toLowerCase().includes(filters.expenseItem.toLowerCase())) return false;
      if (filters.orgUnit && assignment.orgUnitName && !assignment.orgUnitName.toLowerCase().includes(filters.orgUnit.toLowerCase())) return false;
      if (filters.position && filters.position !== 'all-positions' && assignment.registrarPosition !== filters.position) return false;
      
      // Effective date filter
      const effectiveDate = format(filters.effectiveDate, 'yyyy-MM-dd');
      if (assignment.effectiveFrom > effectiveDate) return false;
      if (assignment.effectiveTo && assignment.effectiveTo < effectiveDate) return false;
      
      return true;
    });

    setFilteredAssignments(filtered);
  }, [assignments, filters]);

  const handleCreateAssignment = async () => {
    try {
      setIsLoading(true);
      
      const newAssignment: RegistrarAssignment = {
        id: Date.now().toString(),
        expenseItemId: formData.expenseItemId,
        expenseItemCode: getExpenseItemCode(formData.expenseItemId),
        expenseItemName: getExpenseItemName(formData.expenseItemId),
        expenseItemPath: getExpenseItemPath(formData.expenseItemId),
        orgUnitId: formData.orgUnitId && formData.orgUnitId !== 'all-units' ? formData.orgUnitId : undefined,
        orgUnitName: formData.orgUnitId && formData.orgUnitId !== 'all-units' ? getOrgUnitName(formData.orgUnitId) : undefined,
        registrarPosition: formData.registrarPosition,
        priority: formData.priority,
        effectiveFrom: format(formData.effectiveFrom, 'yyyy-MM-dd'),
        effectiveTo: formData.effectiveTo ? format(formData.effectiveTo, 'yyyy-MM-dd') : undefined,
        status: 'active',
        createdBy: 'current-user',
        createdByName: 'Текущий пользователь',
        createdAt: new Date().toISOString()
      };

      setAssignments(prev => [newAssignment, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      toast.success('Назначение регистратора создано');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Ошибка создания назначения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAssignment = async () => {
    if (!editingAssignment) return;

    try {
      setIsLoading(true);
      
      const updatedAssignment: RegistrarAssignment = {
        ...editingAssignment,
        expenseItemId: formData.expenseItemId,
        expenseItemCode: getExpenseItemCode(formData.expenseItemId),
        expenseItemName: getExpenseItemName(formData.expenseItemId),
        expenseItemPath: getExpenseItemPath(formData.expenseItemId),
        orgUnitId: formData.orgUnitId && formData.orgUnitId !== 'all-units' ? formData.orgUnitId : undefined,
        orgUnitName: formData.orgUnitId && formData.orgUnitId !== 'all-units' ? getOrgUnitName(formData.orgUnitId) : undefined,
        registrarPosition: formData.registrarPosition,
        priority: formData.priority,
        effectiveFrom: format(formData.effectiveFrom, 'yyyy-MM-dd'),
        effectiveTo: formData.effectiveTo ? format(formData.effectiveTo, 'yyyy-MM-dd') : undefined
      };

      setAssignments(prev => prev.map(a => a.id === editingAssignment.id ? updatedAssignment : a));
      setEditingAssignment(null);
      resetForm();
      toast.success('Назначение регистратора обновлено');
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Ошибка обновления назначения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateAssignment = (assignment: RegistrarAssignment) => {
    setFormData({
      expenseItemId: assignment.expenseItemId,
      orgUnitId: assignment.orgUnitId || 'all-units',
      registrarPosition: assignment.registrarPosition,
      priority: assignment.priority,
      effectiveFrom: new Date(),
      effectiveTo: null
    });
    setShowCreateDialog(true);
  };

  const handleArchiveAssignment = async (assignmentId: string) => {
    try {
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, status: 'archived' as const } : a
      ));
      toast.success('Назначение архивировано');
    } catch (error) {
      console.error('Error archiving assignment:', error);
      toast.error('Ошибка архивирования назначения');
    }
  };

  const handleBulkExport = () => {
    // Mock export
    const csvData = filteredAssignments.map(a => ({
      'Код статьи': a.expenseItemCode,
      'Статья расходов': a.expenseItemName,
      'Подразделение': a.orgUnitName || 'Все',
      'Должность': a.registrarPosition,
      'Приоритет': a.priority,
      'Действует с': a.effectiveFrom,
      'Действует до': a.effectiveTo || 'Бессрочно',
      'Статус': a.status === 'active' ? 'Активно' : 'Архив',
      'Создал': a.createdByName,
      'Дата создания': format(new Date(a.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })
    }));
    
    console.log('Exporting CSV:', csvData);
    toast.success('Экспорт завершен');
  };

  const handleBulkImport = () => {
    // Mock import
    toast.success('Импорт шаблона загружен');
  };

  const handleLookupResponsibles = async () => {
    try {
      setIsLoading(true);
      
      // Mock API call
      const mockResponsibles: ResponsibleAssignment[] = [
        {
          expenseItemId: '1',
          expenseItemName: 'Закуп товара (EXW)',
          orgUnitId: '1.1',
          orgUnitName: 'Финансовый департамент',
          registrarName: 'Иванова А.С.',
          registrarPosition: 'Ведущий специалист по учету',
          priority: 1,
          effectiveFrom: '2025-01-01',
          effectiveTo: '2025-12-31'
        }
      ];
      
      setResponsibleAssignments(mockResponsibles);
      toast.success('Данные об ответственных загружены');
    } catch (error) {
      console.error('Error looking up responsibles:', error);
      toast.error('Ошибка загрузки данных об ответственных');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      expenseItemId: '',
      orgUnitId: 'all-units',
      registrarPosition: '',
      priority: 1,
      effectiveFrom: new Date(),
      effectiveTo: null
    });
  };

  const openEditDialog = (assignment: RegistrarAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      expenseItemId: assignment.expenseItemId,
      orgUnitId: assignment.orgUnitId || 'all-units',
      registrarPosition: assignment.registrarPosition,
      priority: assignment.priority,
      effectiveFrom: new Date(assignment.effectiveFrom),
      effectiveTo: assignment.effectiveTo ? new Date(assignment.effectiveTo) : null
    });
  };

  // Helper functions
  const getExpenseItemCode = (id: string): string => {
    const item = expenseItems.find(item => item.id === id);
    return item ? item.code : '';
  };

  const getExpenseItemName = (id: string): string => {
    const item = expenseItems.find(item => item.id === id);
    return item ? item.name : '';
  };

  const getExpenseItemPath = (id: string): string => {
    const item = expenseItems.find(item => item.id === id);
    return item ? `${item.code} ${item.name}` : '';
  };

  const getOrgUnitName = (id: string): string => {
    const findUnit = (units: OrgUnit[]): string => {
      for (const unit of units) {
        if (unit.id === id) return unit.name;
        if (unit.children) {
          const found = findUnit(unit.children);
          if (found) return found;
        }
      }
      return '';
    };
    return findUnit(mockOrgUnits);
  };

  const renderExpenseItemTree = (items: ExpenseItem[], onSelect: (item: ExpenseItem) => void) => {
    return items.filter(item => item.isActive).map(item => (
      <CommandItem
        key={item.id}
        className="cursor-pointer"
        onSelect={() => onSelect(item)}
      >
        <span>
          {item.code} {item.name}
        </span>
      </CommandItem>
    ));
  };

  const renderOrgUnitTree = (units: OrgUnit[], onSelect: (unit: OrgUnit) => void) => {
    return units.map(unit => (
      <div key={unit.id}>
        <CommandItem
          className="cursor-pointer"
          onSelect={() => onSelect(unit)}
        >
          <span style={{ paddingLeft: `${unit.level * 16}px` }}>
            {unit.children ? <ChevronRight className="w-4 h-4 inline mr-1" /> : <span className="w-5 inline-block" />}
            {unit.name}
          </span>
        </CommandItem>
        {unit.children && renderOrgUnitTree(unit.children, onSelect)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="pl-0">
              ← Н��зад
            </Button>
          )}
          <div>
            <h2>Назначения регистраторов</h2>
            <p className="text-muted-foreground">Управление назначениями регистраторов по статьям расходов</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="w-4 h-4 mr-2" />
            Импорт
          </Button>
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingAssignment(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Создать назначение
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? 'Редактировать назначение' : 'Создать назначение регистратора'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssignment 
                    ? 'Измените параметры назначения регистратора для выбранной статьи расходов.' 
                    : 'Создайте новое назначение регистратора для обработки заявок по определенной статье расходов.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Статья расходов *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {formData.expenseItemId ? getExpenseItemPath(formData.expenseItemId) : 'Выберите статью'}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0">
                        <Command>
                          <CommandInput placeholder="Поиск статьи..." />
                          <CommandEmpty>Статья не найдена</CommandEmpty>
                          <CommandList className="max-h-64">
                            <CommandGroup>
                              {renderExpenseItemTree(expenseItems, (item) => {
                                setFormData(prev => ({ ...prev, expenseItemId: item.id }));
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Подразделение</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {formData.orgUnitId && formData.orgUnitId !== 'all-units' ? getOrgUnitName(formData.orgUnitId) : 'Все подразделения'}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <Command>
                          <CommandInput placeholder="Поиск подразделения..." />
                          <CommandEmpty>Подразделение не найдено</CommandEmpty>
                          <CommandList className="max-h-64">
                            <CommandGroup>
                              <CommandItem onSelect={() => setFormData(prev => ({ ...prev, orgUnitId: 'all-units' }))}>
                                Все подразделения
                              </CommandItem>
                              {renderOrgUnitTree(mockOrgUnits, (unit) => {
                                setFormData(prev => ({ ...prev, orgUnitId: unit.id }));
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Должность регистратора *</Label>
                    <Select 
                      value={formData.registrarPosition} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, registrarPosition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите должность" />
                      </SelectTrigger>
                      <SelectContent>
                        {registrarPositions.map(position => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Приоритет</Label>
                    <Select 
                      value={formData.priority.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 (Высший)</SelectItem>
                        <SelectItem value="2">2 (Высокий)</SelectItem>
                        <SelectItem value="3">3 (Средний)</SelectItem>
                        <SelectItem value="4">4 (Низкий)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Действует с *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarDays className="w-4 h-4 mr-2" />
                          {format(formData.effectiveFrom, 'dd.MM.yyyy', { locale: ru })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.effectiveFrom}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, effectiveFrom: date }))}
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Действует до</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarDays className="w-4 h-4 mr-2" />
                          {formData.effectiveTo ? format(formData.effectiveTo, 'dd.MM.yyyy', { locale: ru }) : 'Бессрочно'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.effectiveTo || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, effectiveTo: date || null }))}
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingAssignment(null);
                      resetForm();
                    }}
                  >
                    Отмена
                  </Button>
                  <Button 
                    onClick={editingAssignment ? handleEditAssignment : handleCreateAssignment}
                    disabled={!formData.expenseItemId || !formData.registrarPosition || isLoading}
                  >
                    {isLoading ? 'Сохранение...' : (editingAssignment ? 'Обновить' : 'Создать')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Назначения</TabsTrigger>
          <TabsTrigger value="lookup">Просмотр на дату</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Статья расходов</Label>
                  <Input
                    placeholder="Поиск по статье..."
                    value={filters.expenseItem}
                    onChange={(e) => setFilters(prev => ({ ...prev, expenseItem: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Подразделение</Label>
                  <Input
                    placeholder="Поиск по подразделению..."
                    value={filters.orgUnit}
                    onChange={(e) => setFilters(prev => ({ ...prev, orgUnit: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="archived">Архив</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Должность</Label>
                  <Select value={filters.position} onValueChange={(value) => setFilters(prev => ({ ...prev, position: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все должности" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-positions">Все должности</SelectItem>
                      {registrarPositions.map(position => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>На дату</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {format(filters.effectiveDate, 'dd.MM.yyyy', { locale: ru })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.effectiveDate}
                        onSelect={(date) => date && setFilters(prev => ({ ...prev, effectiveDate: date }))}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Назначения ({filteredAssignments.length})</CardTitle>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Выбрано: {selectedItems.length}
                    </span>
                    <Button variant="outline" size="sm">
                      <Archive className="w-4 h-4 mr-2" />
                      Архивировать
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredAssignments.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(filteredAssignments.map(a => a.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Статья расходов</TableHead>
                    <TableHead>Подразделение</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead className="w-20">Приоритет</TableHead>
                    <TableHead>Период действия</TableHead>
                    <TableHead className="w-20">Статус</TableHead>
                    <TableHead>Создал</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(assignment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems(prev => [...prev, assignment.id]);
                            } else {
                              setSelectedItems(prev => prev.filter(id => id !== assignment.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{assignment.expenseItemCode}</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">
                            {assignment.expenseItemName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.orgUnitName || (
                          <span className="text-muted-foreground italic">Все подразделения</span>
                        )}
                      </TableCell>
                      <TableCell>{assignment.registrarPosition}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(assignment.effectiveFrom), 'dd.MM.yyyy', { locale: ru })}</div>
                          <div className="text-muted-foreground">
                            {assignment.effectiveTo 
                              ? `до ${format(new Date(assignment.effectiveTo), 'dd.MM.yyyy', { locale: ru })}`
                              : 'бессрочно'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                          {assignment.status === 'active' ? 'Активно' : 'Архив'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{assignment.createdByName}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(assignment.createdAt), 'dd.MM.yy HH:mm', { locale: ru })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateAssignment(assignment)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Дублировать
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <History className="w-4 h-4 mr-2" />
                              История
                            </DropdownMenuItem>
                            <Separator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Архивировать
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Архивировать назначение?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Назначение будет перемещено в архив и станет неактивным.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleArchiveAssignment(assignment.id)}>
                                    Архивировать
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAssignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Назначения не найдены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lookup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Просмотр ответственных на дату</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Статья расходов</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {responsibleFilters.expenseItemId ? getExpenseItemPath(responsibleFilters.expenseItemId) : 'Выберите статью'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0">
                      <Command>
                        <CommandInput placeholder="Поиск статьи..." />
                        <CommandEmpty>Статья не найдена</CommandEmpty>
                        <CommandList className="max-h-64">
                          <CommandGroup>
                            {renderExpenseItemTree(expenseItems, (item) => {
                              setResponsibleFilters(prev => ({ ...prev, expenseItemId: item.id }));
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Подразделение</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {responsibleFilters.orgUnitId && responsibleFilters.orgUnitId !== 'all-units' ? getOrgUnitName(responsibleFilters.orgUnitId) : 'Все подразделения'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Поиск подразделения..." />
                        <CommandEmpty>Подразделение не найдено</CommandEmpty>
                        <CommandList className="max-h-64">
                          <CommandGroup>
                            <CommandItem onSelect={() => setResponsibleFilters(prev => ({ ...prev, orgUnitId: 'all-units' }))}>
                              Все подразделения
                            </CommandItem>
                            {renderOrgUnitTree(mockOrgUnits, (unit) => {
                              setResponsibleFilters(prev => ({ ...prev, orgUnitId: unit.id }));
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>На дату</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {format(responsibleFilters.asOfDate, 'dd.MM.yyyy', { locale: ru })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={responsibleFilters.asOfDate}
                        onSelect={(date) => date && setResponsibleFilters(prev => ({ ...prev, asOfDate: date }))}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button onClick={handleLookupResponsibles} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? 'Поиск...' : 'Найти ответственных'}
              </Button>

              {responsibleAssignments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Статья расходов</TableHead>
                      <TableHead>Подразделение</TableHead>
                      <TableHead>Ответственный</TableHead>
                      <TableHead>Должность</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Период действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responsibleAssignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell>{assignment.expenseItemName}</TableCell>
                        <TableCell>
                          {assignment.orgUnitName || (
                            <span className="text-muted-foreground italic">Все подразделения</span>
                          )}
                        </TableCell>
                        <TableCell>{assignment.registrarName}</TableCell>
                        <TableCell>{assignment.registrarPosition}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(assignment.effectiveFrom), 'dd.MM.yyyy', { locale: ru })}</div>
                            <div className="text-muted-foreground">
                              {assignment.effectiveTo 
                                ? `до ${format(new Date(assignment.effectiveTo), 'dd.MM.yyyy', { locale: ru })}`
                                : 'бессрочно'
                              }
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingAssignment && (
        <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать назначение регистратора</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Статья расходов *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.expenseItemId ? getExpenseItemPath(formData.expenseItemId) : 'Выберите статью'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0">
                      <Command>
                        <CommandInput placeholder="Поиск статьи..." />
                        <CommandEmpty>Статья не найдена</CommandEmpty>
                        <CommandList className="max-h-64">
                          <CommandGroup>
                            {renderExpenseItemTree(expenseItems, (item) => {
                              setFormData(prev => ({ ...prev, expenseItemId: item.id }));
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Подразделение</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.orgUnitId ? getOrgUnitName(formData.orgUnitId) : 'Все подразделения'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Поиск подразделения..." />
                        <CommandEmpty>Подразделение не найдено</CommandEmpty>
                        <CommandList className="max-h-64">
                          <CommandGroup>
                            <CommandItem onSelect={() => setFormData(prev => ({ ...prev, orgUnitId: '' }))}>
                              Все подразделения
                            </CommandItem>
                            {renderOrgUnitTree(mockOrgUnits, (unit) => {
                              setFormData(prev => ({ ...prev, orgUnitId: unit.id }));
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Должность регистратора *</Label>
                  <Select 
                    value={formData.registrarPosition} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, registrarPosition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите должность" />
                    </SelectTrigger>
                    <SelectContent>
                      {registrarPositions.map(position => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select 
                    value={formData.priority.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Высший)</SelectItem>
                      <SelectItem value="2">2 (Высокий)</SelectItem>
                      <SelectItem value="3">3 (Средний)</SelectItem>
                      <SelectItem value="4">4 (Низкий)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Действует с *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {format(formData.effectiveFrom, 'dd.MM.yyyy', { locale: ru })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.effectiveFrom}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, effectiveFrom: date }))}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Действует до</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {formData.effectiveTo ? format(formData.effectiveTo, 'dd.MM.yyyy', { locale: ru }) : 'Бессрочно'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.effectiveTo || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, effectiveTo: date || null }))}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingAssignment(null)}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleEditAssignment}
                  disabled={!formData.expenseItemId || !formData.registrarPosition || isLoading}
                >
                  {isLoading ? 'Сохранение...' : 'Обновить'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}