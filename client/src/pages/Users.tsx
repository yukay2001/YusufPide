import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Trash2, UserPlus, Shield, Edit, Plus, KeyRound } from "lucide-react";

interface User {
  id: string;
  username: string;
  roleId: string;
  createdAt: string;
}

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

const userSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  roleId: z.string({
    required_error: "Rol seçimi gerekli"
  })
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
  confirmPassword: z.string().min(6, "Şifre onayı gerekli")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"]
});

const roleSchema = z.object({
  name: z.string().min(1, "Rol adı gerekli"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "En az bir izin seçmelisiniz")
});

type UserForm = z.infer<typeof userSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type RoleForm = z.infer<typeof roleSchema>;

export default function Users() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

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

  const userForm = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      roleId: ""
    }
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const roleForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: []
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kullanıcı oluşturulamadı");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      userForm.reset();
      setIsUserDialogOpen(false);
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu"
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

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const response = await fetch(`/api/users/${selectedUserId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Şifre değiştirilemedi");
      }
      return await response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
      setSelectedUserId(null);
      toast({
        title: "Başarılı",
        description: "Şifre başarıyla değiştirildi"
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

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Kullanıcı silinemedi");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi"
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
      roleForm.reset();
      setIsRoleDialogOpen(false);
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
      roleForm.reset();
      setIsRoleDialogOpen(false);
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

  const onUserSubmit = (data: UserForm) => {
    createUserMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  const onRoleSubmit = (data: RoleForm) => {
    if (editingRole) {
      updateRoleMutation.mutate({ ...data, id: editingRole.id });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEditRole = (role: Role) => {
    const rolePerms = rolePermissions
      .filter(rp => rp.roleId === role.id)
      .map(rp => rp.permissionId);
    
    roleForm.reset({
      name: role.name,
      description: role.description || "",
      permissionIds: rolePerms
    });
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz? Bu role atanmış kullanıcılar etkilenebilir.`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleChangePassword = (userId: string) => {
    setSelectedUserId(userId);
    passwordForm.reset();
    setIsPasswordDialogOpen(true);
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || "Bilinmiyor";
  };

  const getRolePermissions = (roleId: string): Permission[] => {
    const permIds = rolePermissions
      .filter(rp => rp.roleId === roleId)
      .map(rp => rp.permissionId);
    return permissions.filter(p => permIds.includes(p.id));
  };

  const isLoading = usersLoading || rolesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kullanıcı ve Rol Yönetimi</h1>
        <p className="text-muted-foreground mt-1">
          Kullanıcıları ve rollerini yönetin
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Roller</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Sistem kullanıcılarını yönetin</p>
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-user">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Yeni Kullanıcı
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                  <DialogDescription>
                    Sisteme yeni bir kullanıcı ekleyin
                  </DialogDescription>
                </DialogHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-new-username"
                              placeholder="Kullanıcı adı"
                              disabled={createUserMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-new-password"
                              type="password"
                              placeholder="Şifre"
                              disabled={createUserMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="roleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={createUserMutation.isPending || rolesLoading}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-user-role">
                                <SelectValue placeholder="Rol seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUserDialogOpen(false)}
                        disabled={createUserMutation.isPending}
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        data-testid="button-save-user"
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
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
              {users.map((user) => (
                <Card key={user.id} data-testid={`card-user-${user.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {user.username}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleChangePassword(user.id)}
                        data-testid={`button-change-password-${user.id}`}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`${user.username} kullanıcısını silmek istediğinize emin misiniz?`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>{getRoleName(user.roleId)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Oluşturulma: {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <Card>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  Henüz kullanıcı bulunmuyor
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Özel roller oluşturun ve izinlerini yönetin</p>
            <Dialog open={isRoleDialogOpen} onOpenChange={(open) => {
              setIsRoleDialogOpen(open);
              if (!open) {
                setEditingRole(null);
                roleForm.reset();
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
                <Form {...roleForm}>
                  <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="space-y-4">
                    <FormField
                      control={roleForm.control}
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
                      control={roleForm.control}
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
                      control={roleForm.control}
                      name="permissionIds"
                      render={() => (
                        <FormItem>
                          <FormLabel>İzinler (Erişim Yetkisi)</FormLabel>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {permissions.map((permission) => (
                              <FormField
                                key={permission.id}
                                control={roleForm.control}
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
                          setIsRoleDialogOpen(false);
                          setEditingRole(null);
                          roleForm.reset();
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

          {permissionsLoading ? (
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
                          onClick={() => handleEditRole(role)}
                          data-testid={`button-edit-role-${role.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(role)}
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

          {!permissionsLoading && roles.length === 0 && (
            <Card>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  Henüz rol bulunmuyor. Yeni bir rol oluşturun.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Değiştir</DialogTitle>
            <DialogDescription>
              Kullanıcının şifresini değiştirin
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mevcut Şifre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-current-password"
                        type="password"
                        placeholder="Mevcut şifre"
                        disabled={changePasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-new-password-change"
                        type="password"
                        placeholder="Yeni şifre (en az 6 karakter)"
                        disabled={changePasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-confirm-password"
                        type="password"
                        placeholder="Yeni şifreyi tekrar girin"
                        disabled={changePasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    setSelectedUserId(null);
                    passwordForm.reset();
                  }}
                  disabled={changePasswordMutation.isPending}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save-password"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? "Kaydediliyor..." : "Şifreyi Değiştir"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
