import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus, Edit, Trash2, Search, Calendar, DollarSign } from 'lucide-react';
import { ExportContractsService, ExportContractCreate, ExportContractUpdate } from '../../services/exportContractsService';
import { ExportContract } from '../../types';
import { toast } from 'sonner';

interface ExportContractSelectorProps {
  onContractSelect?: (contract: ExportContract) => void;
  selectedContractId?: string;
  showCreateForm?: boolean;
}

export const ExportContractSelector: React.FC<ExportContractSelectorProps> = ({
  onContractSelect,
  selectedContractId,
  showCreateForm = false
}) => {
  const [contracts, setContracts] = useState<ExportContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(showCreateForm);
  const [editingContract, setEditingContract] = useState<ExportContract | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ExportContractCreate>({
    contractNumber: '',
    contractDate: '',
    counterpartyId: '',
    amount: 0,
    currencyCode: 'KZT'
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const response = await ExportContractsService.getExportContracts();
      setContracts(response.contracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('Ошибка загрузки контрактов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!formData.contractNumber || !formData.contractDate) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      setIsCreating(true);
      const newContract = await ExportContractsService.createExportContract(formData);
      setContracts([...contracts, newContract]);
      setFormData({
        contractNumber: '',
        contractDate: '',
        counterpartyId: '',
        amount: 0,
        currencyCode: 'KZT'
      });
      setShowCreate(false);
      toast.success('Контракт создан');
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Ошибка создания контракта');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateContract = async (contractId: string, data: ExportContractUpdate) => {
    try {
      setIsUpdating(true);
      const updatedContract = await ExportContractsService.updateExportContract(contractId, data);
      setContracts(contracts.map(c => c.id === contractId ? updatedContract : c));
      setEditingContract(null);
      toast.success('Контракт обновлён');
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Ошибка обновления контракта');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот контракт?')) return;

    try {
      await ExportContractsService.deleteExportContract(contractId);
      setContracts(contracts.filter(c => c.id !== contractId));
      toast.success('Контракт удалён');
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Ошибка удаления контракта');
    }
  };

  const filteredContracts = contracts.filter(contract =>
    contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.contractDate.includes(searchTerm)
  );

  const handleFormChange = (field: keyof ExportContractCreate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка контрактов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Экспортные контракты</span>
            <Button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Создать контракт
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру или дате контракта..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Создать новый контракт</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Номер контракта *</Label>
                    <Input
                      id="contractNumber"
                      value={formData.contractNumber}
                      onChange={(e) => handleFormChange('contractNumber', e.target.value)}
                      placeholder="Введите номер контракта"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractDate">Дата контракта *</Label>
                    <Input
                      id="contractDate"
                      type="date"
                      value={formData.contractDate}
                      onChange={(e) => handleFormChange('contractDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Сумма</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currencyCode">Валюта</Label>
                    <Select
                      value={formData.currencyCode}
                      onValueChange={(value) => handleFormChange('currencyCode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KZT">KZT</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateContract}
                    disabled={isCreating}
                    className="flex items-center gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Создать
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contracts List */}
          <div className="space-y-3">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Контракты не найдены' : 'Нет контрактов'}
              </div>
            ) : (
              filteredContracts.map((contract) => (
                <Card
                  key={contract.id}
                  className={`cursor-pointer transition-colors ${
                    selectedContractId === contract.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onContractSelect?.(contract)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{contract.contractNumber}</h4>
                          <Badge variant={contract.isActive ? 'default' : 'secondary'}>
                            {contract.isActive ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(contract.contractDate).toLocaleDateString()}
                          </div>
                          {contract.amount && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {contract.amount} {contract.currencyCode}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingContract(contract);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContract(contract.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingContract && (
        <Card className="fixed inset-4 z-50 bg-background border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Редактировать контракт</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingContract(null)}
              >
                Закрыть
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Номер контракта</Label>
                  <Input
                    value={editingContract.contractNumber}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      contractNumber: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Дата контракта</Label>
                  <Input
                    type="date"
                    value={editingContract.contractDate}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      contractDate: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Сумма</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingContract.amount || ''}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      amount: parseFloat(e.target.value) || undefined
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Валюта</Label>
                  <Select
                    value={editingContract.currencyCode || 'KZT'}
                    onValueChange={(value) => setEditingContract({
                      ...editingContract,
                      currencyCode: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KZT">KZT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdateContract(editingContract.id, {
                    contractNumber: editingContract.contractNumber,
                    contractDate: editingContract.contractDate,
                    amount: editingContract.amount,
                    currencyCode: editingContract.currencyCode
                  })}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Сохранить
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setEditingContract(null)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
