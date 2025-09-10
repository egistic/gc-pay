import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../ui/table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ResponsibleSnapshot {
  expenseItemId: string;
  registrarId: string;
  registrarName: string;
  registrarPosition: string;
  orgUnitId?: string;
  orgUnitName?: string;
  snapshotDate: string;
}

interface ResponsibleSnapshotsProps {
  snapshots: ResponsibleSnapshot[];
  getExpenseItemName: (id: string) => string;
  className?: string;
}

export function ResponsibleSnapshots({ 
  snapshots, 
  getExpenseItemName, 
  className = '' 
}: ResponsibleSnapshotsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Снапшоты ответственных</CardTitle>
      </CardHeader>
      <CardContent>
        {snapshots.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статья расходов</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Подразделение</TableHead>
                <TableHead>Дата снапшота</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot, index) => (
                <TableRow key={index}>
                  <TableCell>{getExpenseItemName(snapshot.expenseItemId)}</TableCell>
                  <TableCell>{snapshot.registrarName}</TableCell>
                  <TableCell>{snapshot.registrarPosition}</TableCell>
                  <TableCell>{snapshot.orgUnitName || 'Все подразделения'}</TableCell>
                  <TableCell>
                    {format(new Date(snapshot.snapshotDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Снапшоты будут созданы после классификации при включенной опции
          </div>
        )}
      </CardContent>
    </Card>
  );
}
