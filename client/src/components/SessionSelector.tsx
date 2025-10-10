import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BusinessSession {
  id: string;
  date: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function SessionSelector() {
  const { toast } = useToast();
  const [showNewDayDialog, setShowNewDayDialog] = useState(false);

  const { data: sessions = [] } = useQuery<BusinessSession[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: activeSession } = useQuery<BusinessSession | null>({
    queryKey: ["/api/sessions/active"],
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/sessions/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Gün değiştirildi" });
    },
  });

  const createDayMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      return await apiRequest("POST", "/api/sessions", {
        date: today.toISOString().split('T')[0],
        name: formattedDate,
        isActive: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowNewDayDialog(false);
      toast({ title: "Yeni gün başlatıldı" });
    },
  });

  const handleNewDay = () => {
    setShowNewDayDialog(true);
  };

  const confirmNewDay = () => {
    createDayMutation.mutate();
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <Select
        value={activeSession?.id || ""}
        onValueChange={(id) => activateMutation.mutate(id)}
      >
        <SelectTrigger className="w-64" data-testid="select-session">
          <SelectValue placeholder="Gün seçin" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNewDay}
        data-testid="button-new-day"
      >
        <Plus className="w-4 h-4 mr-1" />
        Yeni Gün
      </Button>

      <Dialog open={showNewDayDialog} onOpenChange={setShowNewDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Gün Başlat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Yeni bir iş günü başlatmak istediğinizden emin misiniz? Bu, önceki günün kayıtlarını arşivleyip yeni bir gün başlatacaktır.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewDayDialog(false)}>
                İptal
              </Button>
              <Button onClick={confirmNewDay} data-testid="button-confirm-new-day">
                Yeni Gün Başlat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
