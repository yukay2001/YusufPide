import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calendar, FileDown, Play, Square } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface BusinessSession {
  id: string;
  date: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function SessionSelector() {
  const { toast } = useToast();

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

  const startDayMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/sessions/start-day");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      toast({ title: "Yeni gün başlatıldı", description: "Satış ve gider işlemlerine başlayabilirsiniz" });
    },
    onError: () => {
      toast({ title: "Gün başlatılamadı", variant: "destructive" });
    },
  });

  const endDayMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/sessions/end-day");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      toast({ title: "Gün sonlandırıldı", description: "Aktif gün bulunmamaktadır" });
    },
    onError: () => {
      toast({ title: "Gün sonlandırılamadı", variant: "destructive" });
    },
  });

  const handleDownloadReport = () => {
    if (!activeSession) {
      toast({ 
        title: "Hata", 
        description: "Rapor indirilebilmesi için bir gün seçmelisiniz",
        variant: "destructive" 
      });
      return;
    }
    
    // Open PDF in new tab/download
    window.open(`/api/sessions/${activeSession.id}/report`, '_blank');
    toast({ 
      title: "Rapor indiriliyor", 
      description: "Günlük rapor PDF olarak hazırlanıyor..." 
    });
  };

  return (
    <div className="flex flex-col gap-2">
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
          variant={activeSession ? "outline" : "default"}
          size="sm"
          onClick={() => startDayMutation.mutate()}
          disabled={startDayMutation.isPending}
          data-testid="button-start-day"
        >
          <Play className="w-4 h-4 mr-2" />
          Gün Başlat
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => endDayMutation.mutate()}
          disabled={!activeSession || endDayMutation.isPending}
          data-testid="button-end-day"
        >
          <Square className="w-4 h-4 mr-2" />
          Günü Kapat
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownloadReport}
          disabled={!activeSession}
          data-testid="button-download-report"
        >
          <FileDown className="w-4 h-4 mr-2" />
          PDF İndir
        </Button>
      </div>
    </div>
  );
}
