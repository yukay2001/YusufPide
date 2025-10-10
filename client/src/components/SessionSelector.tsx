import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    </div>
  );
}
