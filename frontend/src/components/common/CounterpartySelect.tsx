import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Check, ChevronsUpDown, Building, MapPin, Tag } from 'lucide-react';
import { cn } from '../ui/utils';
import { Counterparty, CounterpartyCategory } from '../../types';
import { useDictionaries } from '../../hooks/useDictionaries';

interface CounterpartySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  onCounterpartyAdd?: (counterparty: Counterparty) => void;
  filterByCategory?: CounterpartyCategory;
  onCategoryChange?: (category: CounterpartyCategory) => void;
  compact?: boolean;
}

export function CounterpartySelect({ value, onValueChange, onCounterpartyAdd, filterByCategory, onCategoryChange, compact = false }: CounterpartySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get counterparties from dictionary service
  const { items: counterparties, state } = useDictionaries('counterparties');

  // Фильтрация по категории и поиску
  const filteredCounterparties = counterparties.filter(cp => {
    const matchesActive = cp.isActive;
    const matchesCategory = !filterByCategory || cp.category === filterByCategory;
    const matchesSearch = !searchTerm || (
      cp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cp.binIin?.includes(searchTerm) ||
      (cp.email && cp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cp.region && cp.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cp.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return matchesActive && matchesCategory && matchesSearch;
  });

  // Группировка контрагентов по категориям
  const groupedCounterparties = filteredCounterparties.reduce((groups, cp) => {
    const category = cp.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(cp);
    return groups;
  }, {} as Record<CounterpartyCategory, Counterparty[]>);

  const selectedCounterparty = counterparties.find(cp => cp.id === value);

  const getCategoryBadgeColor = (category: CounterpartyCategory) => {
    switch (category) {
      case 'Поставщик СХ': return 'bg-green-100 text-green-800';
      case 'Элеватор': return 'bg-blue-100 text-blue-800';
      case 'Поставщик Услуг': return 'bg-orange-100 text-orange-800';
      case 'Покупатель': return 'bg-purple-100 text-purple-800';
      case 'Партнер/БВУ': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  return (
    <div className="space-y-2">
      {!compact && (
        <Label>
          Контрагент *
          {filterByCategory && (
            <Badge className={`ml-2 ${getCategoryBadgeColor(filterByCategory)}`}>
              {filterByCategory}
            </Badge>
          )}
        </Label>
      )}
      <div className="flex gap-2 items-stretch" style={{ alignItems: 'stretch' }}>
        {/* Category Selection */}
        <div className="flex-1">
          <Select
            value={filterByCategory || ''}
            onValueChange={(value) => {
              if (onCategoryChange) {
                onCategoryChange(value as CounterpartyCategory);
              }
            }}
          >
            <SelectTrigger 
              className="h-12 min-h-12"
              style={{ height: '48px', minHeight: '48px' }}
            >
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Поставщик СХ">Поставщик СХ</SelectItem>
              <SelectItem value="Элеватор">Элеватор</SelectItem>
              <SelectItem value="Поставщик Услуг">Поставщик Услуг</SelectItem>
              <SelectItem value="Покупатель">Покупатель</SelectItem>
              <SelectItem value="Партнер/БВУ">Партнер/БВУ</SelectItem>
              <SelectItem value="Bulk">Bulk</SelectItem>
              <SelectItem value="Test">Test</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Counterparty Selection Button */}
        <div className="flex-1">
          <Popover open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
              setSearchTerm(''); // Clear search when closing
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-12 min-h-12"
                style={{ height: '48px', minHeight: '48px' }}
              >
                {selectedCounterparty ? (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{selectedCounterparty.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {filterByCategory ? `Выберите контрагента (${filterByCategory})...` : "Выберите контрагента..."}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder={filterByCategory ? `Поиск среди ${filterByCategory.toLowerCase()}...` : "Поиск контрагента..."} 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>
                    {state.isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Загрузка контрагентов...</span>
                      </div>
                    ) : state.error ? (
                      <div className="text-center py-4 text-red-500">
                        <p>Ошибка загрузки контрагентов</p>
                        <p className="text-xs text-muted-foreground mt-1">{state.error}</p>
                      </div>
                    ) : filteredCounterparties.length === 0 ? (
                      filterByCategory 
                        ? `Контрагенты категории "${filterByCategory}" не найдены.`
                        : "Контрагент не найден."
                    ) : null}
                  </CommandEmpty>
                  
                  {/* Если фильтр по категории не установлен, показываем группы */}
                  {!filterByCategory ? (
                    Object.entries(groupedCounterparties).map(([category, counterparties]) => (
                      <CommandGroup key={category} heading={category}>
                        {counterparties.map((counterparty) => (
                          <CommandItem
                            key={counterparty.id}
                            value={counterparty.id}
                            onSelect={() => {
                              onValueChange(counterparty.id);
                              setOpen(false);
                            }}
                            className="flex items-start gap-2 p-3"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 mt-0.5 flex-shrink-0",
                                value === counterparty.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{counterparty.name}</span>
                                <Badge className={`${getCategoryBadgeColor(counterparty.category)} text-xs px-1 py-0 flex-shrink-0`}>
                                  {counterparty.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>БИН/ИИН: {counterparty.binIin}</span>
                                {counterparty.region && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {counterparty.region}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))
                  ) : (
                    // Если фильтр установлен, показываем только контрагентов выбранной категории
                    <CommandGroup>
                      {filteredCounterparties.map((counterparty) => (
                        <CommandItem
                          key={counterparty.id}
                          value={counterparty.id}
                          onSelect={() => {
                            onValueChange(counterparty.id);
                            setOpen(false);
                          }}
                          className="flex items-start gap-2 p-3"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 mt-0.5 flex-shrink-0",
                              value === counterparty.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="truncate">{counterparty.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>БИН/ИИН: {counterparty.binIin}</span>
                              {counterparty.region && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {counterparty.region}
                                </span>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Counterparty Details - Same height as other fields */}
        <div 
          className="flex-1 rounded-md border p-3 bg-muted/30 h-12 min-h-12 flex items-center"
          style={{ height: '48px', minHeight: '48px' }}
        >
          {selectedCounterparty ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm text-muted-foreground w-full">
              <div>
                <strong>БИН/ИИН:</strong> {selectedCounterparty.binIin}
              </div>
              <div>
                <strong>Адрес:</strong> {selectedCounterparty.address || 'Не указан'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground w-full text-center">
              Выберите контрагента для просмотра деталей
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}