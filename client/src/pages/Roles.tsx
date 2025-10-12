import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Trash2, Plus, Shield, Edit } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
}

interface RolePermission {
  roleId: string;
  permissionId: string;
}

const roleSchema = z.object({
  name: z.string().min(1, "Rol adı gerekli"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "En az bir izin seçmelisiniz")
});

type RoleForm = z.infer<typeof roleSchema>;

export default function Roles() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"]
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"]
  });

  const { data: rolePermissions = [] } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions"],
    enabled: roles.length > 0
  });

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: []
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleForm) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description
        }),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rol oluşturulamadı");
      }
      const role = await response.json();
      
      for (const permissionId of data.permissionIds) {
        await fetch(`/api/roles/${role.id}/permissions/${permissionId}`, {
          method: "POST",
          credentials: "include"
        });
      }
      
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      form.reset();
      setIsDialogOpen(false);
      setEditingRole(null);
      toast({
        title: "Başarılı",
        description: "Rol başarıyla oluşturuldu"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: RoleForm & { id: string }) => {
      const response = await fetch(`/api/roles/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description
        }),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rol güncellenemedi");
      }
      
      const existingPerms = rolePermissions.filter(rp => rp.roleId === data.id);
      const existingPermIds = existingPerms.map(rp => rp.permissionId);
      
      const toAdd = data.permissionIds.filter(pid => !existingPermIds.includes(pid));
      const toRemove = existingPermIds.filter(pid => !data.permissionIds.includes(pid));
      
      for (const permissionId of toRemove) {
        await fetch(`/api/roles/${data.id}/permissions/${permissionId}`, {
          method: "DELETE",
          credentials: "include"
        });
      }
      
      for (const permissionId of toAdd) {
        await fetch(`/api/roles/${data.id}/permissions/${permissionId}`, {
          method: "POST",
          credentials: "include"
        });
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      form.reset();
      setIsDialogOpen(false);
      setEditingRole(null);
      toast({
        title: "Başarılı",
        description: "Rol başarıyla güncellendi"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rol silinemedi");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      toast({
        title: "Başarılı",
        description: "Rol başarıyla silindi"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: RoleForm) => {
    if (editingRole) {
      updateRoleMutation.mutate({ ...data, id: editingRole.id });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEdit = (role: Role) => {
    const rolePerms = rolePermissions
      .filter(rp => rp.roleId === role.id)
      .map(rp => rp.permissionId);
    
    form.reset({
      name: role.name,
      description: role.description || "",
      permissionIds: rolePerms
    });
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz? Bu role atanmış kullanıcılar etkilenebilir.`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const getRolePermissions = (roleId: string): Permission[] => {
    const permIds = rolePermissions
      .filter(rp => rp.roleId === roleId)
      .map(rp => rp.permissionId);
    return permissions.filter(p => permIds.includes(p.id));
  };

  const isLoading = rolesLoading || permissionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rol Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Özel roller oluşturun ve izinlerini yönetin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRole(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-role">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Rol Düzenle" : "Yeni Rol Ekle"}</DialogTitle>
              <DialogDescription>
                {editingRole ? "Rolü düzenleyin ve izinlerini güncelleyin" : "Yeni bir rol oluşturun ve izinlerini seçin"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol Adı</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-role-name"
                          placeholder="Örn: Kasa Görevlisi"
                          disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-role-description"
                          placeholder="Bu rolün açıklaması"
                          disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissionIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>İzinler (Erişim Yetkisi)</FormLabel>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {permissions.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissionIds"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-permission-${permission.key}`}
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), permission.id]
                                        : (field.value || []).filter(id => id !== permission.id);
                                      field.onChange(newValue);
                                    }}
                                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {permission.name}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingRole(null);
                      form.reset();
                    }}
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-save-role"
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  >
                    {createRoleMutation.isPending || updateRoleMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const rolePerms = getRolePermissions(role.id);
            return (
              <Card key={role.id} data-testid={`card-role-${role.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base font-medium">
                      {role.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(role)}
                      data-testid={`button-edit-role-${role.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(role)}
                      disabled={deleteRoleMutation.isPending}
                      data-testid={`button-delete-role-${role.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {role.description}
                    </p>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">İzinler:</p>
                    <div className="flex flex-wrap gap-1">
                      {rolePerms.length > 0 ? (
                        rolePerms.map(perm => (
                          <span
                            key={perm.id}
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                            data-testid={`badge-permission-${perm.key}`}
                          >
                            {perm.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">İzin yok</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && roles.length === 0 && (
        <Card>
          <CardContent>
            <div className="py-8 text-center text-muted-foreground">
              Henüz rol bulunmuyor. Yeni bir rol oluşturun.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
