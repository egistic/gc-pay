import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Search, Plus, Edit, Trash2, Shield, Users, BarChart3 } from 'lucide-react';
import { RoleService, Role, RoleCreate, RoleUpdate, RoleStatistics, RoleUsage } from '../../services/roleService';

interface RoleManagementProps {
  onBack: () => void;
}

export function RoleManagement({ onBack }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [statistics, setStatistics] = useState<RoleStatistics | null>(null);
  const [roleUsage, setRoleUsage] = useState<Record<string, RoleUsage>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [createForm, setCreateForm] = useState<RoleCreate>({
    code: '',
    name: ''
  });
  const [editForm, setEditForm] = useState<RoleUpdate>({
    code: '',
    name: '',
    is_active: true
  });

  // Load initial data
  useEffect(() => {
    loadRoles();
    loadStatistics();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await RoleService.getRoles();
      setRoles(data);
      
      // Load usage data for each role
      const usageData: Record<string, RoleUsage> = {};
      for (const role of data) {
        try {
          const usage = await RoleService.getRoleUsage(role.id);
          usageData[role.id] = usage;
        } catch (error) {
          console.error(`Error loading usage for role ${role.id}:`, error);
        }
      }
      setRoleUsage(usageData);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await RoleService.getRoleStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRole = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRoles(filteredRoles.map(role => role.id));
    } else {
      setSelectedRoles([]);
    }
  };

  const handleCreateRole = async () => {
    try {
      await RoleService.createRole(createForm);
      setShowCreateDialog(false);
      setCreateForm({ code: '', name: '' });
      loadRoles();
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditForm({
      code: role.code,
      name: role.name,
      is_active: role.is_active ?? true
    });
    setShowEditDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    try {
      await RoleService.updateRole(editingRole.id, editForm);
      setShowEditDialog(false);
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRoles = async () => {
    if (selectedRoles.length === 0) return;
    
    try {
      for (const roleId of selectedRoles) {
        await RoleService.deleteRole(roleId);
      }
      setSelectedRoles([]);
      loadRoles();
    } catch (error) {
      console.error('Error deleting roles:', error);
    }
  };

  const handleManagePermissions = (roleId: string) => {
    // This would open a permissions management dialog
    console.log('Manage permissions for role', roleId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Управление ролями</h2>
          <p className="text-muted-foreground">Создание, редактирование и управление ролями системы</p>
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
              <CardTitle className="text-sm font-medium">Всего ролей</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_roles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных ролей</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.active_roles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Наиболее используемая</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {statistics.most_used_role || 'Нет данных'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Наименее используемая</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {statistics.least_used_role || 'Нет данных'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Поиск ролей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по названию или коду роли..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={loadRoles}>
              <Search className="h-4 w-4 mr-2" />
              Поиск
            </Button>
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
                Создать роль
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Создание роли</DialogTitle>
                <DialogDescription>
                  Заполните форму для создания новой роли
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-code">Код роли</Label>
                  <Input
                    id="create-code"
                    placeholder="admin, user, etc."
                    value={createForm.code}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-name">Название роли</Label>
                  <Input
                    id="create-name"
                    placeholder="Администратор, Пользователь, etc."
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateRole}>
                    Создать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {selectedRoles.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteRoles}>
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить ({selectedRoles.length})
            </Button>
          )}
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Роли ({filteredRoles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Пользователей</TableHead>
                <TableHead>Последнее назначение</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Роли не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map(role => {
                  const usage = roleUsage[role.id];
                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRoles.includes(role.id)}
                          onCheckedChange={(checked) => handleSelectRole(role.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{role.code}</TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "Активна" : "Неактивна"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usage ? usage.user_count : '-'}
                      </TableCell>
                      <TableCell>
                        {usage?.last_assigned ? 
                          new Date(usage.last_assigned).toLocaleDateString('ru-RU') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManagePermissions(role.id)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование роли</DialogTitle>
            <DialogDescription>
              Измените данные роли
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-code">Код роли</Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Название роли</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="edit-active">Активна</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateRole}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
