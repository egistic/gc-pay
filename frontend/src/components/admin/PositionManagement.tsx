import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { Position, Department, User } from '../../types';
import { AdminService, UserWithRoles } from '../../services/adminService';

interface PositionManagementProps {
  onBack: () => void;
}

interface PositionWithDepartment extends Position {
  department?: Department;
  userCount?: number;
}

interface DepartmentWithPositions extends Department {
  positions?: Position[];
  userCount?: number;
}

export function PositionManagement({ onBack }: PositionManagementProps) {
  const [positions, setPositions] = useState<PositionWithDepartment[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithPositions[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [showCreatePositionDialog, setShowCreatePositionDialog] = useState(false);
  const [showCreateDepartmentDialog, setShowCreateDepartmentDialog] = useState(false);
  const [showEditPositionDialog, setShowEditPositionDialog] = useState(false);
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false);
  const [showUserAssignmentDialog, setShowUserAssignmentDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionWithDepartment | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentWithPositions | null>(null);
  const [selectedPositionForUsers, setSelectedPositionForUsers] = useState<PositionWithDepartment | null>(null);
  const [activeTab, setActiveTab] = useState<'positions' | 'departments' | 'assignments'>('positions');
  
  const [positionForm, setPositionForm] = useState({
    name: '',
    code: '',
    department_id: ''
  });
  
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: ''
  });

  // Load initial data
  useEffect(() => {
    loadPositions();
    loadDepartments();
    loadUsers();
  }, []);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getPositions();
      const positionsWithCounts: PositionWithDepartment[] = await Promise.all(
        data.map(async (position) => {
          try {
            const users = await AdminService.getPositionUsers(position.id);
            return {
              ...position,
              name: position.title, // Map title to name for compatibility
              code: position.title, // Use title as code for now
              userCount: users.length
            };
          } catch (error) {
            console.warn(`Error loading users for position ${position.id}:`, error);
            return {
              ...position,
              name: position.title,
              code: position.title,
              userCount: 0
            };
          }
        })
      );
      setPositions(positionsWithCounts);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await AdminService.getDepartments();
      const departmentsWithPositions: DepartmentWithPositions[] = await Promise.all(
        data.map(async (department) => {
          try {
            // Get positions for this department
            const allPositions = await AdminService.getPositions();
            const departmentPositions = allPositions.filter(pos => pos.department_id === department.id);
            
            // Calculate total user count for this department
            let totalUserCount = 0;
            for (const position of departmentPositions) {
              try {
                const users = await AdminService.getPositionUsers(position.id);
                totalUserCount += users.length;
              } catch (error) {
                console.warn(`Error loading users for position ${position.id}:`, error);
              }
            }
            
            return {
              ...department,
              positions: departmentPositions.map(pos => ({
                ...pos,
                name: pos.title,
                code: pos.title
              })),
              userCount: totalUserCount
            };
          } catch (error) {
            console.warn(`Error loading positions for department ${department.id}:`, error);
            return {
              ...department,
              positions: [],
              userCount: 0
            };
          }
        })
      );
      setDepartments(departmentsWithPositions);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await AdminService.searchUsers({ limit: 1000 });
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic
  };

  const handleSelectPosition = (positionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPositions(prev => [...prev, positionId]);
    } else {
      setSelectedPositions(prev => prev.filter(id => id !== positionId));
    }
  };

  const handleSelectAllPositions = (checked: boolean) => {
    if (checked) {
      setSelectedPositions(positions.map(position => position.id));
    } else {
      setSelectedPositions([]);
    }
  };

  const handleSelectDepartment = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments(prev => [...prev, departmentId]);
    } else {
      setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
    }
  };

  const handleSelectAllDepartments = (checked: boolean) => {
    if (checked) {
      setSelectedDepartments(departments.map(department => department.id));
    } else {
      setSelectedDepartments([]);
    }
  };

  const handleCreatePosition = async () => {
    try {
      await AdminService.createPosition({
        department_id: positionForm.department_id,
        title: positionForm.name,
        description: positionForm.code, // Use code as description
        is_active: true
      });
      setShowCreatePositionDialog(false);
      setPositionForm({ name: '', code: '', department_id: '' });
      loadPositions();
    } catch (error) {
      console.error('Error creating position:', error);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      await AdminService.createDepartment({
        name: departmentForm.name,
        code: departmentForm.code
      });
      setShowCreateDepartmentDialog(false);
      setDepartmentForm({ name: '', code: '' });
      loadDepartments();
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const handleEditPosition = (position: PositionWithDepartment) => {
    setEditingPosition(position);
    setPositionForm({
      name: position.name,
      code: position.code,
      department_id: position.department_id
    });
    setShowEditPositionDialog(true);
  };

  const handleEditDepartment = (department: DepartmentWithPositions) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      code: department.code
    });
    setShowEditDepartmentDialog(true);
  };

  const handleUpdatePosition = async () => {
    if (!editingPosition) return;
    
    try {
      await AdminService.updatePosition(editingPosition.id, {
        department_id: positionForm.department_id,
        title: positionForm.name,
        description: positionForm.code,
        is_active: true
      });
      setShowEditPositionDialog(false);
      setEditingPosition(null);
      loadPositions();
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;
    
    try {
      await AdminService.updateDepartment(editingDepartment.id, {
        name: departmentForm.name,
        code: departmentForm.code
      });
      setShowEditDepartmentDialog(false);
      setEditingDepartment(null);
      loadDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const handleDeletePositions = async () => {
    if (selectedPositions.length === 0) return;
    
    try {
      await Promise.all(selectedPositions.map(id => AdminService.deletePosition(id)));
      setSelectedPositions([]);
      loadPositions();
    } catch (error) {
      console.error('Error deleting positions:', error);
    }
  };

  const handleDeleteDepartments = async () => {
    if (selectedDepartments.length === 0) return;
    
    try {
      await Promise.all(selectedDepartments.map(id => AdminService.deleteDepartment(id)));
      setSelectedDepartments([]);
      loadDepartments();
    } catch (error) {
      console.error('Error deleting departments:', error);
    }
  };

  const handleShowUserAssignments = (position: PositionWithDepartment) => {
    setSelectedPositionForUsers(position);
    setShowUserAssignmentDialog(true);
  };

  const filteredPositions = positions.filter(position =>
    position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    department.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Управление позициями и департаментами</h2>
          <p className="text-muted-foreground">Управление организационной структурой и назначениями пользователей</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="positions">Позиции</TabsTrigger>
          <TabsTrigger value="departments">Департаменты</TabsTrigger>
          <TabsTrigger value="assignments">Назначения</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Поиск позиций
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Поиск по названию, коду или департаменту..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={loadPositions} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dialog open={showCreatePositionDialog} onOpenChange={setShowCreatePositionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать позицию
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Создание позиции</DialogTitle>
                    <DialogDescription>
                      Создайте новую позицию в организационной структуре
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="position-name">Название позиции</Label>
                      <Input
                        id="position-name"
                        value={positionForm.name}
                        onChange={(e) => setPositionForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Введите название позиции"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position-code">Код позиции</Label>
                      <Input
                        id="position-code"
                        value={positionForm.code}
                        onChange={(e) => setPositionForm(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Введите код позиции"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position-department">Департамент</Label>
                      <Select value={positionForm.department_id} onValueChange={(value) => setPositionForm(prev => ({ ...prev, department_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите департамент" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(department => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name} ({department.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreatePositionDialog(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreatePosition}>
                        Создать
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedPositions.length > 0 && (
                <Button variant="destructive" onClick={handleDeletePositions}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить ({selectedPositions.length})
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Импорт
              </Button>
            </div>
          </div>

          {/* Positions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPositions.length === filteredPositions.length && filteredPositions.length > 0}
                        onCheckedChange={handleSelectAllPositions}
                      />
                    </TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Департамент</TableHead>
                    <TableHead>Пользователи</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Загрузка позиций...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredPositions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">Позиции не найдены</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPositions.map(position => (
                      <TableRow key={position.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPositions.includes(position.id)}
                            onCheckedChange={(checked) => handleSelectPosition(position.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{position.name}</TableCell>
                        <TableCell className="font-mono">{position.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {position.department?.name} ({position.department?.code})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {position.userCount || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowUserAssignments(position)}
                              title="Управление пользователями"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPosition(position)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePositions()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Поиск департаментов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Поиск по названию или коду..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={loadDepartments} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dialog open={showCreateDepartmentDialog} onOpenChange={setShowCreateDepartmentDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать департамент
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Создание департамента</DialogTitle>
                    <DialogDescription>
                      Создайте новый департамент в организационной структуре
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="department-name">Название департамента</Label>
                      <Input
                        id="department-name"
                        value={departmentForm.name}
                        onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Введите название департамента"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department-code">Код департамента</Label>
                      <Input
                        id="department-code"
                        value={departmentForm.code}
                        onChange={(e) => setDepartmentForm(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Введите код департамента"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDepartmentDialog(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreateDepartment}>
                        Создать
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedDepartments.length > 0 && (
                <Button variant="destructive" onClick={handleDeleteDepartments}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить ({selectedDepartments.length})
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Импорт
              </Button>
            </div>
          </div>

          {/* Departments Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDepartments.length === filteredDepartments.length && filteredDepartments.length > 0}
                        onCheckedChange={handleSelectAllDepartments}
                      />
                    </TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Позиции</TableHead>
                    <TableHead>Пользователи</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Загрузка департаментов...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredDepartments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">Департаменты не найдены</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments.map(department => (
                      <TableRow key={department.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDepartments.includes(department.id)}
                            onCheckedChange={(checked) => handleSelectDepartment(department.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell className="font-mono">{department.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {department.positions?.length || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {department.userCount || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDepartments()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Назначения пользователей
              </CardTitle>
              <CardDescription>
                Управление назначениями пользователей на позиции
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Функция назначений будет реализована в следующих версиях</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Position Dialog */}
      <Dialog open={showEditPositionDialog} onOpenChange={setShowEditPositionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование позиции</DialogTitle>
            <DialogDescription>
              Измените параметры позиции
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-position-name">Название позиции</Label>
              <Input
                id="edit-position-name"
                value={positionForm.name}
                onChange={(e) => setPositionForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-position-code">Код позиции</Label>
              <Input
                id="edit-position-code"
                value={positionForm.code}
                onChange={(e) => setPositionForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-position-department">Департамент</Label>
              <Select value={positionForm.department_id} onValueChange={(value) => setPositionForm(prev => ({ ...prev, department_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите департамент" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(department => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditPositionDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdatePosition}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDepartmentDialog} onOpenChange={setShowEditDepartmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование департамента</DialogTitle>
            <DialogDescription>
              Измените параметры департамента
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-department-name">Название департамента</Label>
              <Input
                id="edit-department-name"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-department-code">Код департамента</Label>
              <Input
                id="edit-department-code"
                value={departmentForm.code}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDepartmentDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateDepartment}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog */}
      <Dialog open={showUserAssignmentDialog} onOpenChange={setShowUserAssignmentDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Назначения пользователей на позицию</DialogTitle>
            <DialogDescription>
              Управление назначениями для "{selectedPositionForUsers?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Функция назначений пользователей будет реализована в следующих версиях</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserAssignmentDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
