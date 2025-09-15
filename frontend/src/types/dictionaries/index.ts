import { UserRole, CounterpartyCategory, Currency } from '../index';

/**
 * Base interface for all dictionary items
 */
export interface BaseDictionary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  description?: string;
}

/**
 * Expense Item Dictionary
 */
export interface ExpenseItemDictionary extends BaseDictionary {
  parentId?: string;
  ownerRole: UserRole;
  children?: ExpenseItemDictionary[];
  category?: string;
  sortOrder?: number;
}

/**
 * Counterparty Dictionary
 */
export interface CounterpartyDictionary extends BaseDictionary {
  abbreviation: string;
  binIin: string;
  phone: string;
  email: string;
  address: string;
  region: string;
  category: CounterpartyCategory;
  contactPerson?: string;
  bankDetails?: BankDetails;
  isVerified?: boolean;
}

/**
 * Contract Dictionary
 */
export interface ContractDictionary extends BaseDictionary {
  counterpartyId: string;
  expenseItemId: string;
  startDate: string;
  endDate: string;
  limitTotal: number;
  usedTotal: number;
  status: 'active' | 'completed' | 'cancelled';
  currency: Currency;
  contractNumber?: string;
  responsiblePerson?: string;
}

/**
 * Normative Dictionary
 */
export interface NormativeDictionary extends BaseDictionary {
  expenseItemId: string;
  period: 'month' | 'quarter' | 'year';
  amountLimit: number;
  amountLimitWithVAT: number;
  rule: 'hard' | 'soft';
  currentUsed: number;
  currentUsedWithVAT: number;
  effectiveDate: string;
  expiryDate?: string;
}

/**
 * Priority Dictionary
 */
export interface PriorityDictionary extends BaseDictionary {
  rank: number;
  ruleDescription: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
}

/**
 * User Dictionary
 */
export interface UserDictionary extends BaseDictionary {
  email: string;
  roles: UserRole[];
  currentRole: UserRole;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

/**
 * Currency Dictionary
 */
export interface CurrencyDictionary extends BaseDictionary {
  code: string;
  scale: number;
  name?: string;
}

/**
 * VAT Rate Dictionary
 */
export interface VatRateDictionary extends BaseDictionary {
  rate: number;
  name: string;
  description?: string;
}

/**
 * Bank Details for Counterparties
 */
export interface BankDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  swiftCode?: string;
  iban?: string;
  currency: Currency;
}

/**
 * Dictionary Types
 */
export type DictionaryType = 
  | 'expense-articles'
  | 'counterparties'
  | 'currencies'
  | 'vat-rates'
  | 'users';

/**
 * Dictionary Item Types
 */
export type DictionaryItem = 
  | ExpenseItemDictionary
  | CounterpartyDictionary
  | ContractDictionary
  | NormativeDictionary
  | PriorityDictionary
  | UserDictionary
  | CurrencyDictionary
  | VatRateDictionary;

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Dictionary State
 */
export interface DictionaryState {
  currentDictionary: DictionaryType;
  selectedItems: string[];
  searchQuery: string;
  filters: FilterState;
  pagination: PaginationState;
  editingItem: DictionaryItem | null;
  bulkActionMode: boolean;
  relatedData: RelatedDataState;
  isLoading: boolean;
  error: string | null;
}

/**
 * Filter State
 */
export interface FilterState {
  [key: string]: any;
  isActive?: boolean;
  category?: string;
  ownerRole?: UserRole;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Pagination State
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Related Data State
 */
export interface RelatedDataState {
  [key: string]: any;
  relatedItems?: DictionaryItem[];
  suggestions?: DictionaryItem[];
  statistics?: DictionaryStatistics;
}

/**
 * Dictionary Statistics
 */
export interface DictionaryStatistics {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  recentlyUpdated: number;
  byCategory?: { [category: string]: number };
  byOwnerRole?: { [role: string]: number };
}

/**
 * Bulk Action
 */
export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  action: (selectedItems: string[]) => Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

/**
 * Import/Export Options
 */
export interface ImportExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeInactive?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  fields?: string[];
}

/**
 * Dictionary Handler Interface
 */
export interface DictionaryHandler<T extends DictionaryItem> {
  getItems(): Promise<T[]>;
  getItemById(id: string): Promise<T | null>;
  createItem(item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<T>;
  updateItem(id: string, item: Partial<T>): Promise<T>;
  deleteItem(id: string): Promise<boolean>;
  validateItem(item: T): ValidationResult;
  searchItems(query: string): Promise<T[]>;
  getItemsByFilter(filters: FilterState): Promise<T[]>;
  getStatistics(): Promise<DictionaryStatistics>;
  bulkCreate(items: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]): Promise<T[]>;
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<boolean>;
  exportItems(options: ImportExportOptions): Promise<Blob>;
  importItems(file: File): Promise<{ success: T[]; errors: ValidationError[] }>;
}
