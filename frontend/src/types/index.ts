export type UserRole = 'executor' | 'registrar' | 'sub_registrar' | 'distributor' | 'treasurer' | 'admin';

export type PaymentRequestStatus = 
  | 'draft' 
  | 'submitted' 
  | 'classified' 
  | 'allocated' 
  | 'returned' 
  | 'approved' 
  | 'approved-on-behalf'
  | 'to-pay'
  | 'in-register'
  | 'approved-for-payment'
  | 'paid-full'
  | 'paid-partial' 
  | 'declined'
  | 'rejected'
  | 'cancelled'
  | 'distributed'
  | 'report_published'
  | 'export_linked';

export type DistributionStatus = 'pending' | 'distributed' | 'report_published' | 'export_linked';

export type DocumentStatus = 'Не получены' | 'Получены в полном объёме' | 'Частично получены';

export type ReportStatus = 'draft' | 'published';

export type Currency = 'KZT' | 'USD' | 'EUR' | 'RUB' | 'CNY';

export type PayingCompany = 'SD' | 'KD' | 'AEK' | 'ADT' | 'KAS';

export type DocumentType = 'СНО' | 'АО' | 'Договор' | 'Debit note' | 'АВР' | 'Акт сверки' | 'ЭСФ' | 'Заявка';

export type CounterpartyCategory = 'Поставщик СХ' | 'Элеватор' | 'Поставщик Услуг' | 'Покупатель' | 'Партнер/БВУ';

export type VATRate = '0%' | '12%' | '16%' | '20%' | '25%' | 'Неизвестно';

export interface PaymentRequest {
  id: string;
  requestNumber?: string; // Автогенерируемый номер заявки
  createdAt: string;
  updatedAt?: string;
  dueDate: string;
  counterpartyId: string;
  counterpartyCategory?: CounterpartyCategory;
  payingCompany?: PayingCompany;
  amount: number;
  currency: Currency;
  vatRate?: VATRate;
  docNumber?: string;
  docDate?: string;
  docType?: DocumentType;
  docFileUrl?: string;
  fileName?: string;
  files?: Array<{id: string, name: string, url: string, originalName: string}>;
  description: string;
  expenseCategory?: string; // Text field for expense article (filled by executor)
  productService?: string;
  volume?: string;
  priceRate?: string;
  period?: string;
  status: PaymentRequestStatus;
  priority?: string;
  history: HistoryEntry[];
  createdBy: string;
  expenseSplits: ExpenseSplit[];
  paymentAllocations?: PaymentAllocation[];
  paymentExecution?: PaymentExecution;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

export interface ExpenseSplit {
  id: string;
  requestId?: string;
  expenseItemId: string;
  amount: number;
  percentage?: number;
  comment?: string;
  contractId?: string;
  priority?: string;
  subRegistrarId?: string;
}

export interface ExpenseItem {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  isActive: boolean;
  ownerRole: UserRole;
  children?: ExpenseItem[];
}

export interface Counterparty {
  id: string;
  name: string;
  abbreviation: string; // Абревиатура для номера заявки
  binIin: string;
  phone: string;
  email: string;
  address: string;
  category: CounterpartyCategory;
  region?: string; // Область/регион
  isActive: boolean;
}

export interface Contract {
  id: string;
  code: string;
  counterpartyId: string;
  expenseItemId: string;
  startDate: string;
  endDate: string;
  limitTotal: number;
  usedTotal: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Normative {
  id: string;
  expenseItemId: string;
  period: 'month' | 'quarter' | 'year';
  amountLimit: number;
  amountLimitWithVAT: number;
  rule: 'hard' | 'soft';
  currentUsed: number;
  currentUsedWithVAT: number;
}

export interface PaymentAllocation {
  id: string;
  contractId: string;
  amount: number;
  currency: Currency;
  plannedDate: string;
  comment?: string;
  priority?: string;
  requiresPaymentOrder?: boolean;
}

export interface PaymentExecution {
  id: string;
  actualAmount?: number;
  executionDate?: string;
  exchangeRate?: number;
  paymentOrderUrl?: string;
  executionComment?: string;
}

export interface Priority {
  id: string;
  label: string;
  rank: number;
  ruleDescription: string;
  color: string;
}

export interface PaymentRegister {
  id: string;
  name?: string;
  date: string;
  items: string[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'final';
  priorityMix: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  action: string;
  comment?: string;
  userId: string;
  role: UserRole;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles?: UserRole[];
  currentRole?: UserRole;
}

// Новые типы для маршрутизации распорядителей
export interface DistributorBinding {
  id: string;
  expenseItemId: string;
  chiefDistributorUserId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Дополнительные поля для отображения
  expenseItem?: ExpenseItem;
  chiefDistributor?: User;
}

export interface PaymentRequestExtended extends PaymentRequest {
  // Добавляем признак "закрепления" к главному распорядителю
  isAssignedToChief?: boolean;
  chiefDistributorName?: string;
  assignmentReason?: string;
}

// Contract Status Types
export interface ContractStatus {
  hasContract: boolean;
  contractNumber?: string;
  contractDate?: string;
  contractType?: string;
  validityPeriod?: string;
  rates?: string;
  contractInfo?: string;
  contractFileUrl?: string;
}

// Distribution Types
export interface DistributionCreate {
  requestId: string;
  responsibleRegistrarId: string;
  expenseSplits: ExpenseSplitCreate[];
  comment?: string;
}

export interface ExpenseSplitCreate {
  expenseItemId: string;
  amount: number;
  comment?: string;
  contractId?: string;
  priority?: string;
  subRegistrarId?: string;
}

export interface DistributionOut {
  requestId: string;
  responsibleRegistrarId: string;
  expenseSplits: ExpenseSplitOut[];
  comment?: string;
  totalAmount: number;
}

export interface ExpenseSplitOut {
  id: string;
  requestId: string;
  expenseItemId: string;
  amount: number;
  comment?: string;
  contractId?: string;
  priority?: string;
  subRegistrarId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequestCreate {
  requestId: string;
  comment: string;
}

export interface ReturnRequestOut {
  requestId: string;
  comment: string;
  returnedAt: string;
}

// New Workflow Types for REGISTRAR/SUB_REGISTRAR/DISTRIBUTOR

export interface SubRegistrarAssignment {
  id: string;
  requestId: string;
  subRegistrarId: string;
  assignedAt: string;
  status: string;
  createdAt: string;
}

export interface SubRegistrarReport {
  id: string;
  requestId: string;
  subRegistrarId: string;
  documentStatus: DocumentStatus;
  reportData?: Record<string, any>;
  status: ReportStatus;
  publishedAt?: string;
  createdAt: string;
}

export interface DistributorRequest {
  id: string;
  originalRequestId: string;
  expenseArticleId: string;
  amount: number;
  distributorId: string;
  status: string;
  createdAt: string;
}

export interface ExportContract {
  id: string;
  contractNumber: string;
  contractDate: string;
  counterpartyId?: string;
  amount?: number;
  currencyCode?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DistributorExportLink {
  id: string;
  distributorRequestId: string;
  exportContractId: string;
  linkedAt: string;
  linkedBy: string;
}

export interface ParallelDistributionCreate {
  requestId: string;
  subRegistrarId: string;
  distributorId: string;
  expenseSplits: ExpenseSplitCreate[];
  comment?: string;
}

export interface ParallelDistributionOut {
  requestId: string;
  subRegistrarAssignmentId: string;
  distributorRequestIds: string[];
  totalAmount: number;
  status: string;
}

export interface PendingRequest {
  id: string;
  number: string;
  title: string;
  amountTotal: number;
  currencyCode: string;
  counterpartyId: string;
  status: string;
  distributionStatus: DistributionStatus;
  createdAt: string;
}

export interface SubRegistrarReportCreate {
  requestId: string;
  documentStatus: DocumentStatus;
  reportData?: Record<string, any>;
}

export interface SubRegistrarReportUpdate {
  documentStatus?: DocumentStatus;
  reportData?: Record<string, any>;
  status?: ReportStatus;
}

export interface ExportContractLink {
  exportContractId: string;
}