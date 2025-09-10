import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface NormativeCheck {
  expenseItemId: string;
  expenseItemName: string;
  rule: 'hard' | 'soft';
  limitAmount: number;
  usedAmount: number;
  requestAmount: number;
  newTotal: number;
  isExceeded: boolean;
  exceedanceAmount: number;
  exceedancePercentage: number;
}

interface NormativeChecksProps {
  checks: NormativeCheck[];
  className?: string;
}

export function NormativeChecks({ checks, className = '' }: NormativeChecksProps) {
  const softWarnings = checks.filter(check => check.rule === 'soft' && check.isExceeded);
  const hardErrors = checks.filter(check => check.rule === 'hard' && check.isExceeded);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Soft Normative Warnings */}
      {softWarnings.length > 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Превышение мягких лимитов нормативов:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {softWarnings.map((check, index) => (
                  <li key={index}>
                    {check.expenseItemName}: превышение на {check.exceedanceAmount.toLocaleString()} 
                    ({check.exceedancePercentage}%)
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Hard Normative Errors */}
      {hardErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Превышение жестких лимитов нормативов (блокирует отправку):</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {hardErrors.map((check, index) => (
                  <li key={index}>
                    {check.expenseItemName}: превышение на {check.exceedanceAmount.toLocaleString()} 
                    ({check.exceedancePercentage}%)
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Normative Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Проверка нормативов</CardTitle>
        </CardHeader>
        <CardContent>
          {checks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Статья расходов</TableHead>
                  <TableHead>Тип правила</TableHead>
                  <TableHead>Лимит</TableHead>
                  <TableHead>Использовано</TableHead>
                  <TableHead>Заявка</TableHead>
                  <TableHead>Новый итог</TableHead>
                  <TableHead>Превышение</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check, index) => (
                  <TableRow key={index}>
                    <TableCell>{check.expenseItemName}</TableCell>
                    <TableCell>
                      <Badge variant={check.rule === 'hard' ? 'destructive' : 'secondary'}>
                        {check.rule === 'hard' ? 'Жесткий' : 'Мягкий'}
                      </Badge>
                    </TableCell>
                    <TableCell>{check.limitAmount.toLocaleString()}</TableCell>
                    <TableCell>{check.usedAmount.toLocaleString()}</TableCell>
                    <TableCell>{check.requestAmount.toLocaleString()}</TableCell>
                    <TableCell>{check.newTotal.toLocaleString()}</TableCell>
                    <TableCell>
                      {check.isExceeded ? (
                        <div className="text-red-600">
                          +{check.exceedanceAmount.toLocaleString()} ({check.exceedancePercentage}%)
                        </div>
                      ) : (
                        <div className="text-green-600">В пределах лимита</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {check.isExceeded ? (
                        <Badge variant={check.rule === 'hard' ? 'destructive' : 'outline'}>
                          {check.rule === 'hard' ? 'Блокировка' : 'Предупреждение'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Соответствует
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Проверка нормативов будет выполнена после назначения статей расходов
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
