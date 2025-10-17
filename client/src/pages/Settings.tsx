import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Volume2, Palette, Bell, FileText, Upload, Trash2 } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  updatedAt: Date;
}

export default function Settings() {
  const { toast } = useToast();
  
  // Sound file refs
  const newOrderSoundRef = useRef<HTMLInputElement>(null);
  const cancelRequestSoundRef = useRef<HTMLInputElement>(null);
  const orderReadySoundRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Sound URLs (from uploaded files or manual URLs)
  const [newOrderSound, setNewOrderSound] = useState("");
  const [cancelRequestSound, setCancelRequestSound] = useState("");
  const [orderReadySound, setOrderReadySound] = useState("");

  // Theme settings
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#10b981");
  const [logoUrl, setLogoUrl] = useState("");

  // Notification preferences
  const [enableSoundNotifications, setEnableSoundNotifications] = useState(true);
  const [enableStockAlerts, setEnableStockAlerts] = useState(true);
  const [enableOrderNotifications, setEnableOrderNotifications] = useState(true);

  // Report preferences
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportIncludeCharts, setReportIncludeCharts] = useState(true);
  const [reportIncludeDetails, setReportIncludeDetails] = useState(true);

  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Load existing settings when data is available
  useEffect(() => {
    if (settings.length === 0) return;

    // Sound settings
    const newOrder = settings.find(s => s.key === "notification_sound_new_order");
    const cancel = settings.find(s => s.key === "notification_sound_cancel_request");
    const ready = settings.find(s => s.key === "notification_sound_order_ready");
    if (newOrder?.value) setNewOrderSound(newOrder.value);
    if (cancel?.value) setCancelRequestSound(cancel.value);
    if (ready?.value) setOrderReadySound(ready.value);

    // Theme settings
    const primary = settings.find(s => s.key === "theme_primary_color");
    const secondary = settings.find(s => s.key === "theme_secondary_color");
    const logo = settings.find(s => s.key === "theme_logo_url");
    if (primary?.value) setPrimaryColor(primary.value);
    if (secondary?.value) setSecondaryColor(secondary.value);
    if (logo?.value) setLogoUrl(logo.value);

    // Notification preferences
    const soundNotif = settings.find(s => s.key === "enable_sound_notifications");
    const stockAlert = settings.find(s => s.key === "enable_stock_alerts");
    const orderNotif = settings.find(s => s.key === "enable_order_notifications");
    if (soundNotif?.value) setEnableSoundNotifications(soundNotif.value === "true");
    if (stockAlert?.value) setEnableStockAlerts(stockAlert.value === "true");
    if (orderNotif?.value) setEnableOrderNotifications(orderNotif.value === "true");

    // Report preferences
    const format = settings.find(s => s.key === "report_format");
    const charts = settings.find(s => s.key === "report_include_charts");
    const details = settings.find(s => s.key === "report_include_details");
    if (format?.value) setReportFormat(format.value);
    if (charts?.value) setReportIncludeCharts(charts.value === "true");
    if (details?.value) setReportIncludeDetails(details.value === "true");
  }, [settings]);

  const saveSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return await apiRequest("POST", "/api/settings", data);
    },
    onSuccess: (data, variables) => {
      // Optimistically update the cache instead of refetching
      queryClient.setQueryData<Setting[]>(["/api/settings"], (old = []) => {
        const existingIndex = old.findIndex(s => s.key === variables.key);
        if (existingIndex >= 0) {
          // Update existing setting
          const updated = [...old];
          updated[existingIndex] = { ...updated[existingIndex], value: variables.value, updatedAt: new Date() };
          return updated;
        } else {
          // Add new setting
          return [...old, { id: crypto.randomUUID(), key: variables.key, value: variables.value, updatedAt: new Date() }];
        }
      });
      toast({ title: "Ayar kaydedildi" });
    },
    onError: () => {
      toast({ title: "Ayar kaydedilemedi", variant: "destructive" });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "sound" | "logo" }) => {
      const formData = new FormData();
      formData.append("file", file);
      const endpoint = type === "sound" ? "/api/upload/sound" : "/api/upload/logo";
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Dosya yüklenemedi");
      }

      return response.json();
    },
    onError: (error: any) => {
      toast({ 
        title: "Dosya yüklenemedi", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSoundFileUpload = async (
    file: File,
    settingKey: string,
    setStateFn: (value: string) => void
  ) => {
    try {
      const result = await uploadFileMutation.mutateAsync({ file, type: "sound" });
      setStateFn(result.path);
      await saveSettingMutation.mutateAsync({ key: settingKey, value: result.path });
      toast({ title: "Ses dosyası yüklendi ve kaydedildi" });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const result = await uploadFileMutation.mutateAsync({ file, type: "logo" });
      setLogoUrl(result.path);
      await saveSettingMutation.mutateAsync({ key: "theme_logo_url", value: result.path });
      toast({ title: "Logo yüklendi ve kaydedildi" });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleSaveSetting = (key: string, value: string) => {
    saveSettingMutation.mutate({ key, value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2" data-testid="text-settings-title">
          <SettingsIcon className="w-8 h-8" />
          Sistem Ayarları
        </h2>
        <p className="text-muted-foreground">Sistem ayarlarını yapılandırın</p>
      </div>

      <Tabs defaultValue="sounds" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sounds" data-testid="tab-sounds">
            <Volume2 className="w-4 h-4 mr-2" />
            Sesler
          </TabsTrigger>
          <TabsTrigger value="theme" data-testid="tab-theme">
            <Palette className="w-4 h-4 mr-2" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileText className="w-4 h-4 mr-2" />
            Raporlar
          </TabsTrigger>
        </TabsList>

        {/* Sounds Tab */}
        <TabsContent value="sounds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Sesleri</CardTitle>
              <CardDescription>
                Farklı olaylar için ses dosyalarını yükleyin. MP3, WAV, OGG veya M4A formatlarını kullanabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Order Sound */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Yeni Sipariş Sesi
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    ref={newOrderSoundRef}
                    className="flex-1"
                    data-testid="input-new-order-sound-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSoundFileUpload(file, "notification_sound_new_order", setNewOrderSound);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => newOrderSoundRef.current?.click()}
                    data-testid="button-upload-new-order-sound"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {newOrderSound && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mevcut: {newOrderSound}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewOrderSound("");
                        handleSaveSetting("notification_sound_new_order", "");
                      }}
                      data-testid="button-remove-new-order-sound"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Cancel Request Sound */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  İptal Talebi Sesi
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    ref={cancelRequestSoundRef}
                    className="flex-1"
                    data-testid="input-cancel-request-sound-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSoundFileUpload(file, "notification_sound_cancel_request", setCancelRequestSound);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cancelRequestSoundRef.current?.click()}
                    data-testid="button-upload-cancel-request-sound"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {cancelRequestSound && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mevcut: {cancelRequestSound}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCancelRequestSound("");
                        handleSaveSetting("notification_sound_cancel_request", "");
                      }}
                      data-testid="button-remove-cancel-request-sound"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Order Ready Sound */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Sipariş Hazır Sesi
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    ref={orderReadySoundRef}
                    className="flex-1"
                    data-testid="input-order-ready-sound-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSoundFileUpload(file, "notification_sound_order_ready", setOrderReadySound);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => orderReadySoundRef.current?.click()}
                    data-testid="button-upload-order-ready-sound"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {orderReadySound && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mevcut: {orderReadySound}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOrderReadySound("");
                        handleSaveSetting("notification_sound_order_ready", "");
                      }}
                      data-testid="button-remove-order-ready-sound"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema Özelleştirme</CardTitle>
              <CardDescription>
                Uygulamanızın görünümünü özelleştirin. Renkler ve logoyu değiştirin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Logo</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={logoRef}
                    className="flex-1"
                    data-testid="input-logo-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleLogoUpload(file);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => logoRef.current?.click()}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {logoUrl && (
                  <div className="flex items-center gap-2">
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoUrl("");
                        handleSaveSetting("theme_logo_url", "");
                      }}
                      data-testid="button-remove-logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Primary Color */}
              <div className="space-y-3">
                <Label htmlFor="primaryColor">Ana Renk</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10"
                    data-testid="input-primary-color"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSaveSetting("theme_primary_color", primaryColor)}
                    data-testid="button-save-primary-color"
                  >
                    Kaydet
                  </Button>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-3">
                <Label htmlFor="secondaryColor">İkincil Renk</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10"
                    data-testid="input-secondary-color"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#10b981"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSaveSetting("theme_secondary_color", secondaryColor)}
                    data-testid="button-save-secondary-color"
                  >
                    Kaydet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Tercihleri</CardTitle>
              <CardDescription>
                Hangi bildirimleri almak istediğinizi seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="soundNotifications"
                  checked={enableSoundNotifications}
                  onCheckedChange={(checked) => {
                    setEnableSoundNotifications(checked as boolean);
                    handleSaveSetting("enable_sound_notifications", String(checked));
                  }}
                  data-testid="checkbox-sound-notifications"
                />
                <Label htmlFor="soundNotifications" className="cursor-pointer">
                  Ses bildirimleri
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stockAlerts"
                  checked={enableStockAlerts}
                  onCheckedChange={(checked) => {
                    setEnableStockAlerts(checked as boolean);
                    handleSaveSetting("enable_stock_alerts", String(checked));
                  }}
                  data-testid="checkbox-stock-alerts"
                />
                <Label htmlFor="stockAlerts" className="cursor-pointer">
                  Stok uyarıları
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="orderNotifications"
                  checked={enableOrderNotifications}
                  onCheckedChange={(checked) => {
                    setEnableOrderNotifications(checked as boolean);
                    handleSaveSetting("enable_order_notifications", String(checked));
                  }}
                  data-testid="checkbox-order-notifications"
                />
                <Label htmlFor="orderNotifications" className="cursor-pointer">
                  Sipariş bildirimleri
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Raporlama Tercihleri</CardTitle>
              <CardDescription>
                Raporların formatını ve içeriğini özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportFormat">Rapor Formatı</Label>
                <Select
                  value={reportFormat}
                  onValueChange={(value) => {
                    setReportFormat(value);
                    handleSaveSetting("report_format", value);
                  }}
                >
                  <SelectTrigger data-testid="select-report-format">
                    <SelectValue placeholder="Format seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reportCharts"
                  checked={reportIncludeCharts}
                  onCheckedChange={(checked) => {
                    setReportIncludeCharts(checked as boolean);
                    handleSaveSetting("report_include_charts", String(checked));
                  }}
                  data-testid="checkbox-report-charts"
                />
                <Label htmlFor="reportCharts" className="cursor-pointer">
                  Grafikleri dahil et
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reportDetails"
                  checked={reportIncludeDetails}
                  onCheckedChange={(checked) => {
                    setReportIncludeDetails(checked as boolean);
                    handleSaveSetting("report_include_details", String(checked));
                  }}
                  data-testid="checkbox-report-details"
                />
                <Label htmlFor="reportDetails" className="cursor-pointer">
                  Detaylı bilgileri dahil et
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
