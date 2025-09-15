/**
 * Frontend types - normalized and consistent
 * These types represent the structure used throughout the frontend
 */

import { FrontendStatus } from '../constants/status-map';

export interface FrontendPaymentRequest {
  id: string;
  requestNumber: string;
  createdAt: string;
  updatedAt?: string;
  dueDate: string;
  counterpartyId: string;
  counterpartyCategory?: string;
  payingCompany?: string;
  amount: number;
  currency: string;
  vatRate?: string;
  docNumber?: string;
  docDate?: string;
  docType?: string;
  docFileUrl?: string;
  fileName?: string;
  files?: Array<{
    id: string;
    name: string;
    url: string;
    originalName: string;
  }>;
  description: string;
  expenseCategory?: string;
  productService?: string;
  volume?: string;
  priceRate?: string;
  period?: string;
  status: FrontendStatus;
  priority?: string;
  history: HistoryEntry[];
  createdBy: string;
  expenseSplits: ExpenseSplit[];
  paymentAllocations?: PaymentAllocation[];
  paymentExecution?: PaymentExecution;
  attachments?: FileAttachment[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  comment?: string;
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
}

export interface PaymentAllocation {
  id: string;
  requestId: string;
  amount: number;
  currency: string;
  priority: string;
  comment?: string;
}

export interface PaymentExecution {
  id: string;
  requestId: string;
  amount: number;
  currency: string;
  executedAt: string;
  executedBy: string;
  comment?: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

export interface FrontendStatistics {
  totalRequests: number;
  draftCount: number;
  submittedCount: number;
  classifiedCount: number;
  approvedCount: number;
  inRegistryCount: number;
  toPayCount: number;
  approvedForPaymentCount: number;
  paidFullCount: number;
  paidPartialCount: number;
  rejectedCount: number;
  returnedCount: number;
  cancelledCount: number;
  closedCount: number;
  distributedCount: number;
  reportPublishedCount: number;
  exportLinkedCount: number;
  totalAmount: number;
  totalVat: number;
}

export interface FrontendRequestEvent {
  id: string;
  requestId: string;
  eventType: string;
  createdAt: string;
  createdByUserId: string;
  comment?: string;
  data?: Record<string, any>;
}
