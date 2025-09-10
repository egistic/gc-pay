/**
 * Data normalization adapters
 * Converts backend data to frontend format and vice versa
 */

import { BackendRequestOut, BackendRequestListOut, BackendStatistics, BackendRequestEvent } from '../models/BackendTypes';
import { FrontendPaymentRequest, FrontendStatistics, FrontendRequestEvent } from '../models/FrontendTypes';
import { toFrontendStatus } from '../constants/status-map';

/**
 * Convert backend request to frontend format
 * @param backendRequest - Backend request data
 * @returns Normalized frontend request
 */
export const toFrontendRequest = (backendRequest: BackendRequestOut): FrontendPaymentRequest => {
  
  // Extract VAT rate from lines if available
  let vatRate = backendRequest.vat_rate;
  if (!vatRate && backendRequest.lines && backendRequest.lines.length > 0) {
    const firstLine = backendRequest.lines[0];
    if (firstLine.vat_rate_id) {
      vatRate = firstLine.vat_rate_id;
    }
  }

  return {
    id: backendRequest.id,
    requestNumber: backendRequest.number,
    createdAt: backendRequest.created_at || '',
    updatedAt: backendRequest.updated_at,
    dueDate: backendRequest.due_date,
    counterpartyId: backendRequest.counterparty_id,
    counterpartyCategory: backendRequest.counterparty_category,
    payingCompany: backendRequest.paying_company,
    amount: backendRequest.amount_total,
    currency: backendRequest.currency_code,
    vatRate: vatRate,
    docNumber: backendRequest.doc_number,
    docDate: backendRequest.doc_date,
    docType: backendRequest.doc_type,
    docFileUrl: backendRequest.files?.[0]?.url,
    fileName: backendRequest.files?.[0]?.name,
    files: backendRequest.files || [],
    description: backendRequest.title,
    expenseCategory: backendRequest.expense_article_text,
    productService: backendRequest.product_service,
    volume: backendRequest.volume,
    priceRate: backendRequest.price_rate,
    period: backendRequest.period,
    status: toFrontendStatus(backendRequest.status),
    history: [], // Not provided by backend
    createdBy: backendRequest.created_by_user_id,
    expenseSplits: [], // Not provided by backend
    paymentAllocations: [], // Not provided by backend
    paymentExecution: undefined, // Not provided by backend
    attachments: backendRequest.files || []
  };
};

/**
 * Convert backend request list item to frontend format
 * @param backendRequest - Backend request list item
 * @returns Normalized frontend request
 */
export const toFrontendListItem = (backendRequest: BackendRequestListOut): FrontendPaymentRequest => {
  return {
    id: backendRequest.id,
    requestNumber: backendRequest.number,
    createdAt: backendRequest.created_at || '',
    updatedAt: backendRequest.updated_at,
    dueDate: backendRequest.due_date,
    counterpartyId: backendRequest.counterparty_id,
    counterpartyCategory: backendRequest.counterparty_category,
    payingCompany: backendRequest.paying_company,
    amount: backendRequest.amount_total,
    currency: backendRequest.currency_code,
    vatRate: backendRequest.vat_rate,
    docNumber: backendRequest.doc_number,
    docDate: backendRequest.doc_date,
    docType: backendRequest.doc_type,
    docFileUrl: backendRequest.files?.[0]?.url,
    fileName: backendRequest.files?.[0]?.name,
    files: backendRequest.files || [],
    description: backendRequest.title,
    expenseCategory: backendRequest.expense_article_text,
    productService: backendRequest.product_service,
    volume: backendRequest.volume,
    priceRate: backendRequest.price_rate,
    period: backendRequest.period,
    status: toFrontendStatus(backendRequest.status),
    history: [], // Not provided by backend
    createdBy: backendRequest.created_by_user_id,
    expenseSplits: [], // Not provided by backend
    paymentAllocations: [], // Not provided by backend
    paymentExecution: undefined, // Not provided by backend
    attachments: backendRequest.files || []
  };
};

/**
 * Convert backend statistics to frontend format
 * @param backendStats - Backend statistics data
 * @returns Normalized frontend statistics
 */
export const toFrontendStatistics = (backendStats: BackendStatistics): FrontendStatistics => {
  return {
    totalRequests: backendStats.total_requests,
    draftCount: backendStats.draft,
    submittedCount: backendStats.submitted,
    classifiedCount: backendStats.classified,
    approvedCount: backendStats.approved,
    inRegistryCount: backendStats.in_registry,
    paidFullCount: backendStats.paid_full,
    paidPartialCount: backendStats.paid_partial,
    rejectedCount: backendStats.rejected,
    totalAmount: backendStats.total_amount,
    totalVat: backendStats.total_vat
  };
};

/**
 * Convert backend request event to frontend format
 * @param backendEvent - Backend request event
 * @returns Normalized frontend request event
 */
export const toFrontendRequestEvent = (backendEvent: BackendRequestEvent): FrontendRequestEvent => {
  return {
    id: backendEvent.id,
    requestId: backendEvent.request_id,
    eventType: backendEvent.event_type,
    createdAt: backendEvent.created_at,
    createdByUserId: backendEvent.created_by_user_id,
    comment: backendEvent.comment,
    data: backendEvent.data
  };
};

/**
 * Convert multiple backend requests to frontend format
 * @param backendRequests - Array of backend requests
 * @returns Array of normalized frontend requests
 */
export const toFrontendRequestList = (backendRequests: BackendRequestOut[]): FrontendPaymentRequest[] => {
  return backendRequests.map(toFrontendRequest);
};

/**
 * Convert multiple backend request list items to frontend format
 * @param backendRequests - Array of backend request list items
 * @returns Array of normalized frontend requests
 */
export const toFrontendRequestListItemList = (backendRequests: BackendRequestListOut[]): FrontendPaymentRequest[] => {
  return backendRequests.map(toFrontendListItem);
};
