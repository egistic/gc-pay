import React from 'react';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ValidationAlertProps {
  errors: string[];
  warnings?: string[];
  className?: string;
}

export function ValidationAlert({ errors, warnings = [], className = '' }: ValidationAlertProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default ValidationAlert;
