import { useState } from "react";
import { 
  useListUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { User, UserRole } from "@workspace/api-client-react/src/generated/api.schemas";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Edit, Trash, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: users, isLoading } = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "staff" as UserRole,
    isActive: true,
  });

  const handleOpenForm = (item?: User) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        username: item.username,
        password: "", // Leave blank on edit unless changing
        name: item.name || "",
        role: item.role,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData({
        username: "",
        password: "",
        name: "",
        role: "staff" as UserRole,
        isActive: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.username) {
      toast({ title: "Error", description: "Username is required", variant: "destructive" });
      return;
    }
    if (!editingItem && !formData.password) {
      toast({ title: "Error", description: "Password is required for new users", variant: "destructive" });
      return;
    }

    const payload: any = {
      username: formData.username,
      name: formData.name,
      role: formData.role,
      isActive: formData.isActive
    };
    
    if (formData.password) {
      payload.password = formData.password;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          toast({ title: "Success", description: "User updated successfully" });
          setIsFormOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          toast({ title: "Success", description: "User created successfully" });
          setIsFormOpen(false);
        }
      });
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Success", description: "User deleted successfully" });
        setIsDeleteOpen(false);
      }
    });
  };

  if (!isAdmin) {
    return <div className="p-8 text-destructive">Unauthorized access</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system access and roles.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground font-semibold tracking-wide uppercase">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-sidebar/80 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-sidebar/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{item.username}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.name || "-"}</td>
                    <td className="px-6 py-4">
                      {item.role === 'admin' ? (
                        <Badge variant="outline" className="border-primary text-primary uppercase tracking-wider text-[10px]">
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground uppercase tracking-wider text-[10px]">
                          Staff
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isActive ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 uppercase tracking-wider font-bold text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20 uppercase tracking-wider font-bold text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleOpenForm(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => { setDeletingId(item.id); setIsDeleteOpen(true); }}
                          disabled={item.id === currentUser?.id}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[425px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">
              {editingItem ? 'Edit User' : 'Add User'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto overscroll-contain flex-1">
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                className="bg-background"
                disabled={!!editingItem} // Usually can't change username
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Password {editingItem && "(Leave blank to keep current)"}
              </Label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
              <Select value={formData.role} onValueChange={(val: UserRole) => setFormData({...formData, role: val})}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status Aktif</Label>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={checked => setFormData({...formData, isActive: checked})}
              />
            </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground font-semibold">
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive uppercase tracking-wider">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
