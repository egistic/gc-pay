/**
 * Backend types matching the API schemas
 * These types represent the exact structure returned by the backend
 */

import { BackendStatus } from '../constants/status-map';

export interface BackendRequestLineOut {
  id: string;
  article_id: string;
  executor_position_id: string;
  registrar_position_id: string;
  distributor_position_id: string;
  quantity: number;
  amount_net: number;
  vat_rate_id: string;
  currency_code: string;
  status: string;
  note?: string;
}

export interface BackendRequestOut {
  id: string;
  number: string;
  title: string;
  status: BackendStatus;
  created_by_user_id: string;
  counterparty_id: string;
  currency_code: string;
  amount_total: number;
  vat_total: number;
  due_date: string;
  expense_article_text?: string;
  doc_number?: string;
  doc_date?: string;
  doc_type?: string;
  files: Array<{
    id: string;
    name: string;
    url: string;
    originalName: string;
  }>;
  created_at?: string;
  updated_at?: string;
  lines: BackendRequestLineOut[];
  // Additional fields for frontend
  paying_company?: string;
  counterparty_category?: string;
  vat_rate?: string;
  product_service?: string;
  volume?: string;
  price_rate?: string;
  period?: string;
}

export interface BackendRequestListOut {
  id: string;
  number: string;
  title: string;
  status: BackendStatus;
  created_by_user_id: string;
  counterparty_id: string;
  currency_code: string;
  amount_total: number;
  vat_total: number;
  due_date: string;
  expense_article_text?: string;
  doc_number?: string;
  doc_date?: string;
  doc_type?: string;
  files: Array<{
    id: string;
    name: string;
    url: string;
    originalName: string;
  }>;
  created_at?: string;
  updated_at?: string;
  // Additional fields for frontend
  paying_company?: string;
  counterparty_category?: string;
  vat_rate?: string;
  product_service?: string;
  volume?: string;
  price_rate?: string;
  period?: string;
}

export interface BackendStatistics {
  total_requests: number;
  draft: number;
  submitted: number;
  classified: number;
  approved: number;
  in_registry: number;
  paid_full: number;
  paid_partial: number;
  rejected: number;
  overdue: number;
  total_amount: number;
  total_vat: number;
}

export interface BackendRequestEvent {
  id: string;
  request_id: string;
  event_type: string;
  created_at: string;
  created_by_user_id: string;
  comment?: string;
  data?: Record<string, any>;
}
