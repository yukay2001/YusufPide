import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calendar, AlertCircle, FileDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  // Check if viewing a past session
  // A session is "past" if there are any sessions with dates AFTER it
  // This avoids timezone issues by comparing sessions chronologically
  const isViewingPastSession = activeSession && sessions.some(session => {
    const currentDate = activeSession.date.split('T')[0];
    const otherDate = session.date.split('T')[0];
    return otherDate > currentDate;
  });

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
      {isViewingPastSession && (
        <Alert variant="default" className="py-2" data-testid="alert-past-session">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Geçmiş günü görüntülüyorsunuz. Sadece satış ve gider kayıtlarını görüntüleyebilirsiniz.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
