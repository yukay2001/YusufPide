import { Card } from "@/components/ui/card";

interface Column {
  header: string;
  accessor: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export default function DataTable({ columns, data, emptyMessage = "Henüz veri yok" }: DataTableProps) {
  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`p-3 text-sm font-semibold ${
                    col.align === "right" ? "text-right" : 
                    col.align === "center" ? "text-center" : 
                    "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="p-6 text-center text-muted-foreground"
                  data-testid="empty-message"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className="border-b border-border hover-elevate"
                  data-testid={`table-row-${rowIdx}`}
                >
                  {columns.map((col, colIdx) => (
                    <td 
                      key={colIdx} 
                      className={`p-3 text-sm ${
                        col.align === "right" ? "text-right" : 
                        col.align === "center" ? "text-center" : 
                        "text-left"
                      }`}
                    >
                      {row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
