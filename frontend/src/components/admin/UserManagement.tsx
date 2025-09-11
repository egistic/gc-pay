import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Search, Plus, Edit, Trash2, Users, Filter, Download, Upload, FileText, Building2, UserCheck } from 'lucide-react';
import { AdminService, UserWithRoles, UserSearchParams, UserCreate, UserUpdate } from '../../services/adminService';
import { RoleService, Role } from '../../services/roleService';
import { expenseArticleRoleService } from '../../services/expenseArticleRoleService';
import { Position, Department } from '../../types';

interface UserManagementProps {
  onBack: () => void;
}

export function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    query: '',
    role: '',
    is_active: undefined,
    page: 1,
    limit: 20
  });
  const [positionFilter, setPositionFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [createForm, setCreateForm] = useState<UserCreate>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    roles: []
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [editForm, setEditForm] = useState<UserUpdate>({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    is_active: true
  });
  const [showExpenseArticleDialog, setShowExpenseArticleDialog] = useState(false);
  const [selectedUserForExpenseArticle, setSelectedUserForExpenseArticle] = useState<UserWithRoles | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [selectedUserForPosition, setSelectedUserForPosition] = useState<UserWithRoles | null>(null);
  const [positionForm, setPositionForm] = useState({
    position_id: 'none',
    department_id: 'none'
  });

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadPositions();
    loadDepartments();
  }, []);

  // Load users when search params or filters change
  useEffect(() => {
    loadUsers();
  }, [searchParams, positionFilter, departmentFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Combine search params with position and department filters
      const params = {
        ...searchParams,
        position_id: positionFilter === 'all' ? undefined : positionFilter,
        department_id: departmentFilter === 'all' ? undefined : departmentFilter
      };
      
      const data = await AdminService.searchUsers(params);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await RoleService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadPositions = async () => {
    try {
      // This would be replaced with actual API call
      const mockPositions: Position[] = [
        { id: '1', name: 'Менеджер по закупкам', code: 'PURCH_MGR', department_id: '1' },
        { id: '2', name: 'Финансовый аналитик', code: 'FIN_ANALYST', department_id: '2' },
        { id: '3', name: 'Регистратор', code: 'REGISTRAR', department_id: '3' }
      ];
      setPositions(mockPositions);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      // This would be replaced with actual API call
      const mockDepartments: Department[] = [
        { id: '1', name: 'Отдел закупок', code: 'PURCH' },
        { id: '2', name: 'Финансовый отдел', code: 'FIN' },
        { id: '3', name: 'Отдел регистрации', code: 'REG' }
      ];
      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setSearchParams(prev => ({ ...prev, role: role === 'all' ? '' : role, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      is_active: status === 'all' ? undefined : status === 'active', 
      page: 1 
    }));
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleCreateUser = async () => {
    try {
      // Convert selected roles to UserRoleAssign format
      const rolesWithDates = selectedRoles.map(roleId => ({
        role_id: roleId,
        valid_from: new Date().toISOString().split('T')[0], // Today's date
        is_primary: false
      }));

      const userData = {
        ...createForm,
        roles: rolesWithDates
      };

      await AdminService.bulkCreateUsers([userData]);
      setShowCreateDialog(false);
      setCreateForm({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        roles: []
      });
      setSelectedRoles([]);
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setEditForm({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      is_active: user.is_active
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      await AdminService.bulkUpdateUsers([editForm]);
      setShowEditDialog(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      await AdminService.bulkDeleteUsers(selectedUsers);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };

  const handleAddRole = (userId: string, roleId: string) => {
    // This would be implemented with a separate role assignment dialog
    console.log('Add role', roleId, 'to user', userId);
  };

  const handleManageExpenseArticles = (user: UserWithRoles) => {
    setSelectedUserForExpenseArticle(user);
    setShowExpenseArticleDialog(true);
  };

  const handleManagePosition = (user: UserWithRoles) => {
    setSelectedUserForPosition(user);
    setPositionForm({
      position_id: user.position?.id || 'none',
      department_id: user.department?.id || 'none'
    });
    setShowPositionDialog(true);
  };

  const handleAssignPosition = async () => {
    if (!selectedUserForPosition) return;
    
    try {
      // Convert "none" values to null for API
      const positionData = {
        position_id: positionForm.position_id === 'none' ? null : positionForm.position_id,
        department_id: positionForm.department_id === 'none' ? null : positionForm.department_id
      };
      
      // This would be replaced with actual API call
      console.log('Assigning position:', selectedUserForPosition.id, positionData);
      setShowPositionDialog(false);
      setSelectedUserForPosition(null);
      loadUsers();
    } catch (error) {
      console.error('Error assigning position:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Управление пользователями</h2>
          <p className="text-muted-foreground">Создание, редактирование и управление пользователями системы</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Поиск и фильтрация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Поиск</Label>
                <Input
                  id="search"
                  placeholder="Имя или email..."
                  value={searchParams.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role-filter">Роль</Label>
                <Select value={searchParams.role || 'all'} onValueChange={handleRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все роли</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.code}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Статус</Label>
                <Select value={searchParams.is_active === undefined ? 'all' : searchParams.is_active ? 'active' : 'inactive'} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="position-filter">Позиция</Label>
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите позицию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все позиции</SelectItem>
                    {positions.map(position => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department-filter">Департамент</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите департамент" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все департаменты</SelectItem>
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadUsers} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Поиск
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Создать пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Создание пользователя</DialogTitle>
                <DialogDescription>
                  Заполните форму для создания нового пользователя
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Полное имя</Label>
                  <Input
                    id="create-name"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-phone">Телефон</Label>
                  <Input
                    id="create-phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-password">Пароль</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Роли</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Роли не загружены</p>
                    ) : (
                      roles.map(role => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={selectedRoles.includes(role.id)}
                            onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                          />
                          <Label
                            htmlFor={`role-${role.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {role.name} ({role.code})
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    setSelectedRoles([]);
                  }}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Создать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {selectedUsers.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteUsers}>
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить ({selectedUsers.length})
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Пользователи ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Позиция</TableHead>
                <TableHead>Департамент</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      {user.position ? (
                        <Badge variant="outline">
                          {user.position.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Не назначена</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.department ? (
                        <Badge variant="outline">
                          {user.department.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Не назначен</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge key={role.id} variant="secondary">
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Роли не назначены
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddRole(user.id, '')}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageExpenseArticles(user)}
                          title="Управление статьями расходов"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePosition(user)}
                          title="Управление позицией"
                        >
                          <Building2 className="h-4 w-4" />
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

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Полное имя</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Телефон</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="edit-active">Активен</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateUser}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Article Assignment Dialog */}
      <Dialog open={showExpenseArticleDialog} onOpenChange={setShowExpenseArticleDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Управление статьями расходов</DialogTitle>
            <DialogDescription>
              Назначение пользователя {selectedUserForExpenseArticle?.full_name} к статьям расходов с ролями
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUserForExpenseArticle && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Функция управления статьями расходов для пользователя</p>
                <p className="text-sm">будет реализована в следующих версиях</p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowExpenseArticleDialog(false)}
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Position Assignment Dialog */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Назначение позиции</DialogTitle>
            <DialogDescription>
              Назначьте позицию и департамент для пользователя "{selectedUserForPosition?.full_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="position-select">Позиция</Label>
              <Select value={positionForm.position_id} onValueChange={(value) => setPositionForm(prev => ({ ...prev, position_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите позицию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без позиции</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name} ({position.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department-select">Департамент</Label>
              <Select value={positionForm.department_id} onValueChange={(value) => setPositionForm(prev => ({ ...prev, department_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите департамент" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без департамента</SelectItem>
                  {departments.map(department => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPositionDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleAssignPosition}>
                Назначить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
