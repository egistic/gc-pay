/**
 * Custom hook for auto-saving draft requests
 * Provides debounced auto-save functionality with dirty state tracking
 * Cancel-safe and idempotent implementation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PaymentRequestService } from '../../../services/api';
import { FrontendPaymentRequest } from '../models/FrontendTypes';
import { STATUS_MAP } from '../constants/status-map';

interface UseAutoSaveDraftOptions {
  formData: Partial<FrontendPaymentRequest>;
  draftId?: string;
  debounceMs?: number;
  enabled?: boolean;
  autoSaveDisabled?: boolean;
  onDraftCreated?: (draftId: string) => void;
}

interface UseAutoSaveDraftReturn {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  saveDraft: () => Promise<void>;
  markClean: () => void;
  cancelAutoSave: () => void;
}

/**
 * Hook for auto-saving draft requests with debouncing
 * Cancel-safe and idempotent implementation
 * @param options - Auto-save configuration
 * @returns Auto-save state and functions
 */
export const useAutoSaveDraft = (options: UseAutoSaveDraftOptions): UseAutoSaveDraftReturn => {
  const {
    formData,
    draftId,
    debounceMs = 1000, // 1 second default
    enabled = true,
    autoSaveDisabled = false,
    onDraftCreated
  } = options;

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === Stable refs for cancellation ===
  const timerRef = useRef<number | null>(null);
  const runSeqRef = useRef<number>(0);        // Global generation counter
  const enabledRef = useRef<boolean>(enabled);
  const savingRunRef = useRef<number | null>(null);

  // Keep flags up to date
  useEffect(() => { 
    enabledRef.current = enabled; 
  }, [enabled]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /** Complete cancellation: clear timer and invalidate all future then/catch */
  const cancelAutoSave = useCallback(() => {
    clearTimer();
    runSeqRef.current += 1;      // Any pending save becomes "stale"
  }, []);

  const markClean = useCallback(() => setIsDirty(false), []);

  // Helper: safe save execution with "generation"
  const performSave = useCallback(async (capturedSeq: number) => {
    // If hook was disabled/invalidated during wait time — do nothing
    if (!enabledRef.current) {
      return;
    }
    if (capturedSeq !== runSeqRef.current) {
      return;
    }

    // Don't save non-drafts
    if (formData.status && formData.status !== STATUS_MAP.DRAFT) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      savingRunRef.current = capturedSeq;

      // If draftId exists — update, otherwise create
      if (draftId) {
        const { status, ...payload } = formData;
        await PaymentRequestService.update(draftId, {
          ...payload,
          payingCompany: payload.payingCompany as any,
          docType: payload.docType as any,
          counterpartyCategory: payload.counterpartyCategory as any,
          currency: payload.currency as any,
          vatRate: payload.vatRate as any
        });
      } else {
        const created = await PaymentRequestService.create({
          ...formData,
          status: STATUS_MAP.DRAFT,
          payingCompany: formData.payingCompany as any,
          docType: formData.docType as any,
          counterpartyCategory: formData.counterpartyCategory as any,
          currency: formData.currency as any,
          vatRate: formData.vatRate as any
        });
        // New runSeq could have appeared during this time → ignore stale result
        if (capturedSeq !== runSeqRef.current) {
          return;
        }
        onDraftCreated?.(created.id);
      }

      // If this run is already stale — don't set state
      if (capturedSeq !== runSeqRef.current) {
        return;
      }

      setIsDirty(false);
      setLastSaved(new Date());
    } catch (e: any) {
      if (capturedSeq !== runSeqRef.current) {
        return;
      }
      setError(e?.message ?? 'Auto-save error');
    } finally {
      if (capturedSeq === savingRunRef.current) {
        setIsSaving(false);
        savingRunRef.current = null;
      }
    }
  }, [draftId, formData, onDraftCreated]);

  // Auto-save scheduling on changes
  useEffect(() => {
    // If disabled or not DRAFT — don't schedule at all
    if (!enabled || autoSaveDisabled) {
      return;
    }
    if (formData.status && formData.status !== STATUS_MAP.DRAFT) {
      return;
    }

    // Any input change → set dirty and reschedule
    setIsDirty(true);
    clearTimer();

    const nextSeq = runSeqRef.current + 1;
    runSeqRef.current = nextSeq;

    timerRef.current = window.setTimeout(() => {
      // Important: inside timer use capturedSeq
      void performSave(nextSeq);
    }, debounceMs);

    // On any change/unmount — cancel timer and invalidate
    return () => {
      clearTimer();
      runSeqRef.current += 1;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // IMPORTANT: only list real user input triggers,
    // not service flags submit/dialog (they're already in enabled)
    formData.payingCompany,
    formData.docType,
    formData.counterpartyId,
    formData.counterpartyCategory,
    formData.amount,
    formData.currency,
    formData.vatRate,
    formData.dueDate,
    formData.expenseCategory,
    formData.productService,
    formData.volume,
    formData.priceRate,
    formData.period,
    formData.docNumber,
    formData.docDate,
    formData.fileName,
    formData.docFileUrl,
    // If files is array, change trigger by length (or serialization)
    (formData.files as any)?.length,
    enabled,
    autoSaveDisabled,
    debounceMs,
  ]);

  // If enabled → false (submit, dialog close etc.) — instantly cancel everything
  useEffect(() => {
    if (!enabled || autoSaveDisabled) {
      cancelAutoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, autoSaveDisabled]);

  // Manual save function (for backward compatibility)
  const saveDraft = useCallback(async () => {
    if (!enabled || !isDirty || autoSaveDisabled) {
      return;
    }

    // Only save if we have the minimum required fields for the backend
    if (!formData.counterpartyId || !formData.dueDate) {
      return;
    }

    // Don't create new drafts if we're already saving
    if (isSaving) {
      return;
    }

    const nextSeq = runSeqRef.current + 1;
    runSeqRef.current = nextSeq;
    await performSave(nextSeq);
  }, [enabled, isDirty, autoSaveDisabled, formData.counterpartyId, formData.dueDate, isSaving, performSave]);

  return {
    isDirty,
    isSaving,
    lastSaved,
    error,
    saveDraft,
    markClean,
    cancelAutoSave,
  };
};