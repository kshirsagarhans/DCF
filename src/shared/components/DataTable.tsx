import React from 'react';

interface Column<T> {
  id: string;
  header: string;
  accessorFn?: (row: T) => any;
  cell?: (props: { row: T; value: any }) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  group?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  groupBy?: boolean;
  rowClassName?: (row: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  rowClassName, 
  loading,
  emptyMessage = "No data available" 
}: DataTableProps<T>) {
  
  // Group columns if needed
  const groupedColumns: { group: string | undefined; cols: Column<T>[] }[] = [];
  let currentGroup: string | undefined = undefined;
  let currentCols: Column<T>[] = [];

  columns.forEach((col) => {
    if (col.group !== currentGroup) {
      if (currentCols.length > 0) {
        groupedColumns.push({ group: currentGroup, cols: currentCols });
      }
      currentGroup = col.group;
      currentCols = [col];
    } else {
      currentCols.push(col);
    }
  });
  if (currentCols.length > 0) {
    groupedColumns.push({ group: currentGroup, cols: currentCols });
  }

  const hasGroups = groupedColumns.some(g => g.group !== undefined);

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-surface)]">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-[var(--text-tertiary)] rounded-full"></div>
          <div className="h-2 w-2 bg-[var(--text-tertiary)] rounded-full delay-75"></div>
          <div className="h-2 w-2 bg-[var(--text-tertiary)] rounded-full delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-surface)] custom-scrollbar">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        {hasGroups && (
          <thead>
            <tr>
              {groupedColumns.map((g, i) => (
                <th 
                  key={i} 
                  colSpan={g.cols.length}
                  className="px-4 py-2 text-label text-center border-b border-r last:border-r-0 border-[var(--border-subtle)] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface-2)]"
                >
                  {g.group || ''}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.id}
                style={{ width: col.width }}
                className={`px-4 py-2.5 text-label font-medium text-[var(--text-secondary)] border-b border-[var(--border-strong)] bg-[var(--bg-surface)] sticky top-0
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-tertiary)] italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`hover:bg-[var(--bg-surface-2)] transition-colors ${rowClassName ? rowClassName(row, rowIndex) : ''}`}
              >
                {columns.map((col) => {
                  const val = col.accessorFn ? col.accessorFn(row) : (row as any)[col.id];
                  return (
                    <td 
                      key={col.id} 
                      className={`px-4 py-2 text-body-secondary data-number text-[var(--text-primary)]
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                      `}
                    >
                      {col.cell ? col.cell({ row, value: val }) : val}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
