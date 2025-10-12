import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calendar, FileDown, Play, Square, Trash2, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BusinessSession {
  id: string;
  date: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function SessionSelector() {
  const { toast } = useToast();
  const [sessionToDelete, setSessionToDelete] = useState<BusinessSession | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Gün silindi", description: "Gün ve ilgili tüm veriler başarıyla silindi" });
      setSessionToDelete(null);
      setIsManageOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.error || error?.message || "Bir hata oluştu";
      toast({ 
        title: "Gün silinemedi", 
        description: errorMessage,
        variant: "destructive" 
      });
      setSessionToDelete(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      deleteMutation.mutate(sessionToDelete.id);
    }
  };

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
    <>
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
          
          <Popover open={isManageOpen} onOpenChange={setIsManageOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                data-testid="button-manage-sessions"
              >
                <Settings className="w-4 h-4 mr-2" />
                Günleri Yönet
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Geçmiş Günler</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Kayıtlı gün bulunmuyor</p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2 rounded-md hover-elevate"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {session.name}
                            {session.isActive && (
                              <span className="ml-2 text-xs text-primary">(Aktif)</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSessionToDelete(session)}
                          disabled={session.isActive}
                          data-testid={`button-delete-session-${session.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
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

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Günü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{sessionToDelete?.name}</strong> gününü silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve bu güne ait tüm satış ve gider kayıtları silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
