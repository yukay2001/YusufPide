import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Volume2, Bell } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  updatedAt: Date;
}

export default function Settings() {
  const { toast } = useToast();
  const [newOrderSound, setNewOrderSound] = useState("");
  const [cancelRequestSound, setCancelRequestSound] = useState("");
  const [orderReadySound, setOrderReadySound] = useState("");

  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Load existing settings when data is available
  useEffect(() => {
    const newOrder = settings.find(s => s.key === "notification_sound_new_order");
    const cancel = settings.find(s => s.key === "notification_sound_cancel_request");
    const ready = settings.find(s => s.key === "notification_sound_order_ready");

    if (newOrder?.value) setNewOrderSound(newOrder.value);
    if (cancel?.value) setCancelRequestSound(cancel.value);
    if (ready?.value) setOrderReadySound(ready.value);
  }, [settings]);

  const saveSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return await apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Ayarlar kaydedildi" });
    },
    onError: () => {
      toast({ title: "Ayarlar kaydedilemedi", variant: "destructive" });
    },
  });

  const handleSaveNewOrderSound = () => {
    saveSettingMutation.mutate({
      key: "notification_sound_new_order",
      value: newOrderSound,
    });
  };

  const handleSaveCancelRequestSound = () => {
    saveSettingMutation.mutate({
      key: "notification_sound_cancel_request",
      value: cancelRequestSound,
    });
  };

  const handleSaveOrderReadySound = () => {
    saveSettingMutation.mutate({
      key: "notification_sound_order_ready",
      value: orderReadySound,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2" data-testid="text-settings-title">
          <SettingsIcon className="w-8 h-8" />
          Sistem Ayarları
        </h2>
        <p className="text-muted-foreground">Sistem ayarlarını yapılandırın</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bildirim Sesleri
            </CardTitle>
            <CardDescription>
              Farklı olaylar için ses bildirimlerini özelleştirin. Ses URL'si girin veya boş bırakarak varsayılan sesleri kullanın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newOrderSound" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Yeni Sipariş Sesi
              </Label>
              <Input
                id="newOrderSound"
                value={newOrderSound}
                onChange={(e) => setNewOrderSound(e.target.value)}
                placeholder="https://example.com/new-order.mp3"
                data-testid="input-new-order-sound"
              />
              <Button
                onClick={handleSaveNewOrderSound}
                disabled={saveSettingMutation.isPending}
                data-testid="button-save-new-order-sound"
              >
                Kaydet
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancelRequestSound" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                İptal Talebi Sesi
              </Label>
              <Input
                id="cancelRequestSound"
                value={cancelRequestSound}
                onChange={(e) => setCancelRequestSound(e.target.value)}
                placeholder="https://example.com/cancel-request.mp3"
                data-testid="input-cancel-request-sound"
              />
              <Button
                onClick={handleSaveCancelRequestSound}
                disabled={saveSettingMutation.isPending}
                data-testid="button-save-cancel-request-sound"
              >
                Kaydet
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderReadySound" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sipariş Hazır Sesi
              </Label>
              <Input
                id="orderReadySound"
                value={orderReadySound}
                onChange={(e) => setOrderReadySound(e.target.value)}
                placeholder="https://example.com/order-ready.mp3"
                data-testid="input-order-ready-sound"
              />
              <Button
                onClick={handleSaveOrderReadySound}
                disabled={saveSettingMutation.isPending}
                data-testid="button-save-order-ready-sound"
              >
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gelecek Özellikler</CardTitle>
            <CardDescription>
              Yakında eklenecek ayarlar burada görünecektir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              • Otomatik yedekleme ayarları<br/>
              • Raporlama tercihleri<br/>
              • Kullanıcı bildirimleri<br/>
              • Tema özelleştirmeleri
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
