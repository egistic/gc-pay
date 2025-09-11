import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  FileText, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  expenseArticleRoleService, 
  ExpenseArticleRoleAssignment,
  ExpenseArticleRoleAssignmentCreate,
  ExpenseArticleRoleAssignmentUpdate,
  ExpenseArticleRoleAssignmentSearchParams,
  UserExpenseArticleAssignment,
  ExpenseArticleUserAssignment
} from '../../services/expenseArticleRoleService';
import { AdminService, UserWithRoles } from '../../services/adminService';
import { RoleService, Role } from '../../services/roleService';
import { DictionaryService } from '../../services/dictionaries/dictionaryService';
import { DictionaryItem } from '../../types/dictionaries';

interface ExpenseArticleAssignmentProps {
  onBack: () => void;
}

export function ExpenseArticleAssignment({ onBack }: ExpenseArticleAssignmentProps) {
  const [assignments, setAssignments] = useState<ExpenseArticleRoleAssignment[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [expenseArticles, setExpenseArticles] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<ExpenseArticleRoleAssignmentSearchParams>({
    page: 1,
    limit: 20
  });
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ExpenseArticleRoleAssignment | null>(null);
  const [createForm, setCreateForm] = useState<ExpenseArticleRoleAssignmentCreate>({
    user_id: '',
    role_id: '',
    expense_article_id: '',
    valid_from: new Date().toISOString().split('T')[0]
  });
  const [editForm, setEditForm] = useState<ExpenseArticleRoleAssignmentUpdate>({
    valid_from: '',
    valid_to: '',
    is_active: true
  });
  const [activeTab, setActiveTab] = useState<'assignments' | 'by-user' | 'by-article'>('assignments');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    user_ids: [] as string[],
    role_id: '',
    expense_article_ids: [] as string[],
    valid_from: new Date().toISOString().split('T')[0]
  });
  const [userAssignments, setUserAssignments] = useState<UserExpenseArticleAssignment[]>([]);
  const [articleAssignments, setArticleAssignments] = useState<ExpenseArticleUserAssignment[]>([]);

  // Load initial data
  useEffect(() => {
    loadAssignments();
    loadUsers();
    loadRoles();
    loadExpenseArticles();
  }, []);

  // Load assignments when search params change
  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignments();
    } else if (activeTab === 'by-user') {
      loadUserAssignments();
    } else if (activeTab === 'by-article') {
      loadArticleAssignments();
    }
  }, [searchParams, activeTab]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await expenseArticleRoleService.getAssignments(searchParams);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
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

  const loadRoles = async () => {
    try {
      const data = await RoleService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadExpenseArticles = async () => {
    try {
      const dictionaryService = DictionaryService.getInstance();
      const data = await dictionaryService.getItems('expense-articles', { limit: 1000 });
      setExpenseArticles(data);
    } catch (error) {
      console.error('Error loading expense articles:', error);
    }
  };

  const loadUserAssignments = async () => {
    setLoading(true);
    try {
      const data = await expenseArticleRoleService.getAssignmentsByUser(searchParams.user_id || '');
      setUserAssignments(data);
    } catch (error) {
      console.error('Error loading user assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArticleAssignments = async () => {
    setLoading(true);
    try {
      const data = await expenseArticleRoleService.getAssignmentsByExpenseArticle(searchParams.expense_article_id || '');
      setArticleAssignments(data);
    } catch (error) {
      console.error('Error loading article assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    // This would need to be implemented based on backend search capabilities
    console.log('Search:', query);
  };

  const handleUserFilter = (userId: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      user_id: userId === 'all' ? undefined : userId, 
      page: 1 
    }));
  };

  const handleRoleFilter = (roleId: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      role_id: roleId === 'all' ? undefined : roleId, 
      page: 1 
    }));
  };

  const handleArticleFilter = (articleId: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      expense_article_id: articleId === 'all' ? undefined : articleId, 
      page: 1 
    }));
  };

  const handleStatusFilter = (status: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      is_active: status === 'all' ? undefined : status === 'active', 
      page: 1 
    }));
  };

  const handleSelectAssignment = (assignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignments(prev => [...prev, assignmentId]);
    } else {
      setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssignments(assignments.map(assignment => assignment.id));
    } else {
      setSelectedAssignments([]);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await expenseArticleRoleService.createAssignment(createForm);
      setShowCreateDialog(false);
      setCreateForm({
        user_id: '',
        role_id: '',
        expense_article_id: '',
        valid_from: new Date().toISOString().split('T')[0]
      });
      loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleEditAssignment = (assignment: ExpenseArticleRoleAssignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      valid_from: assignment.valid_from.split('T')[0],
      valid_to: assignment.valid_to ? assignment.valid_to.split('T')[0] : '',
      is_active: assignment.is_active
    });
    setShowEditDialog(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    
    try {
      await expenseArticleRoleService.updateAssignment(editingAssignment.id, editForm);
      setShowEditDialog(false);
      setEditingAssignment(null);
      loadAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignments = async () => {
    if (selectedAssignments.length === 0) return;
    
    try {
      await expenseArticleRoleService.bulkDeleteAssignments(selectedAssignments);
      setSelectedAssignments([]);
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignments:', error);
    }
  };

  const handleBulkAssignment = async () => {
    try {
      // Create assignments for each user-article combination
      const promises = bulkForm.user_ids.flatMap(userId =>
        bulkForm.expense_article_ids.map(articleId => 
          expenseArticleRoleService.assignUserToExpenseArticle(
            userId, 
            articleId, 
            bulkForm.role_id
          )
        )
      );
      
      await Promise.all(promises);
      setShowBulkDialog(false);
      setBulkForm({
        user_ids: [],
        role_id: '',
        expense_article_ids: [],
        valid_from: new Date().toISOString().split('T')[0]
      });
      loadAssignments();
    } catch (error) {
      console.error('Error creating bulk assignments:', error);
    }
  };

  const handleBulkUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setBulkForm(prev => ({
        ...prev,
        user_ids: [...prev.user_ids, userId]
      }));
    } else {
      setBulkForm(prev => ({
        ...prev,
        user_ids: prev.user_ids.filter(id => id !== userId)
      }));
    }
  };

  const handleBulkArticleSelection = (articleId: string, checked: boolean) => {
    if (checked) {
      setBulkForm(prev => ({
        ...prev,
        expense_article_ids: [...prev.expense_article_ids, articleId]
      }));
    } else {
      setBulkForm(prev => ({
        ...prev,
        expense_article_ids: prev.expense_article_ids.filter(id => id !== articleId)
      }));
    }
  };

  const getStatusBadge = (isActive: boolean, validTo?: string) => {
    if (!isActive) {
      return <Badge variant="destructive">Неактивно</Badge>;
    }
    
    if (validTo && new Date(validTo) < new Date()) {
      return <Badge variant="secondary">Истекло</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">Активно</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Назначения статей расходов</h2>
          <p className="text-muted-foreground">Управление назначениями пользователей к статьям расходов с ролями</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="assignments">Все назначения</TabsTrigger>
          <TabsTrigger value="by-user">По пользователям</TabsTrigger>
          <TabsTrigger value="by-article">По статьям</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Поиск и фильтрация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="user-filter">Пользователь</Label>
                  <Select value={searchParams.user_id || 'all'} onValueChange={handleUserFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите пользователя" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все пользователи</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role-filter">Роль</Label>
                  <Select value={searchParams.role_id || 'all'} onValueChange={handleRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все роли</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="article-filter">Статья расходов</Label>
                  <Select value={searchParams.expense_article_id || 'all'} onValueChange={handleArticleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статью" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статьи</SelectItem>
                      {expenseArticles.map(article => (
                        <SelectItem key={article.id} value={article.id}>
                          {article.name}
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
                <div className="flex items-end">
                  <Button onClick={loadAssignments} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Поиск
                  </Button>
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
                    Создать назначение
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Создание назначения</DialogTitle>
                    <DialogDescription>
                      Назначьте пользователя к статье расходов с определенной ролью
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="create-user">Пользователь</Label>
                      <Select value={createForm.user_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, user_id: value }))}>
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
                      <Label htmlFor="create-role">Роль</Label>
                      <Select value={createForm.role_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role_id: value }))}>
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
                    <div>
                      <Label htmlFor="create-article">Статья расходов</Label>
                      <Select value={createForm.expense_article_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, expense_article_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статью" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseArticles.map(article => (
                            <SelectItem key={article.id} value={article.id}>
                              {article.name} ({article.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="create-valid-from">Действует с</Label>
                      <Input
                        id="create-valid-from"
                        type="date"
                        value={createForm.valid_from}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, valid_from: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-valid-to">Действует до (необязательно)</Label>
                      <Input
                        id="create-valid-to"
                        type="date"
                        value={createForm.valid_to || ''}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, valid_to: e.target.value || undefined }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreateAssignment}>
                        Создать
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Массовое назначение
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Массовое назначение пользователей к статьям расходов</DialogTitle>
                    <DialogDescription>
                      Выберите пользователей, статьи расходов и роль для массового назначения
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label>Роль</Label>
                      <Select value={bulkForm.role_id} onValueChange={(value) => setBulkForm(prev => ({ ...prev, role_id: value }))}>
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
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Пользователи</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                          {users.map(user => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={bulkForm.user_ids.includes(user.id)}
                                onCheckedChange={(checked) => handleBulkUserSelection(user.id, checked as boolean)}
                              />
                              <Label htmlFor={`user-${user.id}`} className="text-sm">
                                {user.full_name} ({user.email})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Статьи расходов</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                          {expenseArticles.map(article => (
                            <div key={article.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`article-${article.id}`}
                                checked={bulkForm.expense_article_ids.includes(article.id)}
                                onCheckedChange={(checked) => handleBulkArticleSelection(article.id, checked as boolean)}
                              />
                              <Label htmlFor={`article-${article.id}`} className="text-sm">
                                {article.name} ({article.code})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bulk-valid-from">Действует с</Label>
                      <Input
                        id="bulk-valid-from"
                        type="date"
                        value={bulkForm.valid_from}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, valid_from: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                        Отмена
                      </Button>
                      <Button 
                        onClick={handleBulkAssignment}
                        disabled={bulkForm.user_ids.length === 0 || bulkForm.expense_article_ids.length === 0 || !bulkForm.role_id}
                      >
                        Создать назначения ({bulkForm.user_ids.length * bulkForm.expense_article_ids.length})
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedAssignments.length > 0 && (
                <Button variant="destructive" onClick={handleDeleteAssignments}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить ({selectedAssignments.length})
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadAssignments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
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

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Назначения ({assignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAssignments.length === assignments.length && assignments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статья расходов</TableHead>
                    <TableHead>Действует с</TableHead>
                    <TableHead>Действует до</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Назначения не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAssignments.includes(assignment.id)}
                            onCheckedChange={(checked) => handleSelectAssignment(assignment.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.user_name}</div>
                            <div className="text-sm text-muted-foreground">{assignment.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assignment.role_name} ({assignment.role_code})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.expense_article_name}</div>
                            <div className="text-sm text-muted-foreground">{assignment.expense_article_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.valid_from).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          {assignment.valid_to ? new Date(assignment.valid_to).toLocaleDateString('ru-RU') : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(assignment.is_active, assignment.valid_to)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAssignment(assignment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAssignments()}
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

        <TabsContent value="by-user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Назначения по пользователям
              </CardTitle>
              <CardDescription>
                Просмотр всех назначений, сгруппированных по пользователям
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor="user-select">Выберите пользователя</Label>
                    <Select value={searchParams.user_id || 'all'} onValueChange={handleUserFilter}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Выберите пользователя" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все пользователи</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={loadUserAssignments} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                  </Button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Загрузка назначений...</p>
                  </div>
                ) : userAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Назначения не найдены</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userAssignments.map(userAssignment => (
                      <Card key={userAssignment.user_id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {userAssignment.user_name}
                          </CardTitle>
                          <CardDescription>
                            {userAssignment.user_email} • {userAssignment.assignments.length} назначений
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {userAssignment.assignments.map(assignment => (
                              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">
                                    {assignment.role_name}
                                  </Badge>
                                  <div>
                                    <div className="font-medium">{assignment.expense_article_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {assignment.expense_article_code}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(assignment.valid_from).toLocaleDateString('ru-RU')}
                                    {assignment.valid_to && ` - ${new Date(assignment.valid_to).toLocaleDateString('ru-RU')}`}
                                  </div>
                                  {getStatusBadge(assignment.is_active, assignment.valid_to)}
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAssignment(assignment)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAssignments()}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-article" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Назначения по статьям расходов
              </CardTitle>
              <CardDescription>
                Просмотр всех назначений, сгруппированных по статьям расходов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor="article-select">Выберите статью расходов</Label>
                    <Select value={searchParams.expense_article_id || 'all'} onValueChange={handleArticleFilter}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Выберите статью" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статьи</SelectItem>
                        {expenseArticles.map(article => (
                          <SelectItem key={article.id} value={article.id}>
                            {article.name} ({article.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={loadArticleAssignments} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                  </Button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Загрузка назначений...</p>
                  </div>
                ) : articleAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Назначения не найдены</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articleAssignments.map(articleAssignment => (
                      <Card key={articleAssignment.expense_article_id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {articleAssignment.expense_article_name}
                          </CardTitle>
                          <CardDescription>
                            {articleAssignment.expense_article_code} • {articleAssignment.assignments.length} назначений
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {articleAssignment.assignments.map(assignment => (
                              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="font-medium">{assignment.user_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {assignment.user_email}
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    {assignment.role_name}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(assignment.valid_from).toLocaleDateString('ru-RU')}
                                    {assignment.valid_to && ` - ${new Date(assignment.valid_to).toLocaleDateString('ru-RU')}`}
                                  </div>
                                  {getStatusBadge(assignment.is_active, assignment.valid_to)}
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAssignment(assignment)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAssignments()}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование назначения</DialogTitle>
            <DialogDescription>
              Измените параметры назначения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-valid-from">Действует с</Label>
              <Input
                id="edit-valid-from"
                type="date"
                value={editForm.valid_from || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, valid_from: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-valid-to">Действует до (необязательно)</Label>
              <Input
                id="edit-valid-to"
                type="date"
                value={editForm.valid_to || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, valid_to: e.target.value || undefined }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="edit-is-active">Активно</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateAssignment}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
