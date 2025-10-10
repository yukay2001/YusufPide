import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, X } from "lucide-react";

interface DateFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClear: () => void;
  onExport?: () => void;
}

export default function DateFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  onExport,
}: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="date-from" className="text-sm">Başlangıç</Label>
        <Input
          id="date-from"
          data-testid="input-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="date-to" className="text-sm">Bitiş</Label>
        <Input
          id="date-to"
          data-testid="input-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <Button 
        variant="outline" 
        onClick={onClear}
        data-testid="button-clear-filter"
      >
        <X className="w-4 h-4 mr-2" />
        Temizle
      </Button>
      {onExport && (
        <Button 
          variant="outline" 
          onClick={onExport}
          data-testid="button-export"
        >
          <Download className="w-4 h-4 mr-2" />
          CSV İndir
        </Button>
      )}
    </div>
  );
}
