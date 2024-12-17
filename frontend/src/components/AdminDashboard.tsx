import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "./ui/use-toast";

interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface EditUserData {
  email?: string;
  password?: string;
  is_admin?: boolean;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<EditUserData>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (response.status === 403) {
        toast({
          title: "エラー",
          description: "管理者権限が必要です。",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザー一覧の取得に失敗しました。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditData({});
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser || Object.keys(editData).length === 0) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(editData)
        }
      );

      if (!response.ok) {
        throw new Error('更新に失敗しました。');
      }

      toast({
        title: "成功",
        description: "ユーザー情報を更新しました。",
      });
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザー情報の更新に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('このユーザーを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('削除に失敗しました。');
      }

      toast({
        title: "成功",
        description: "ユーザーを削除しました。",
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザーの削除に失敗しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">管理者ダッシュボード</h1>

      <Table>
        <TableCaption>ユーザー一覧</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>管理者権限</TableHead>
            <TableHead>作成日時</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.is_admin ? "はい" : "いいえ"}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleString('ja-JP')}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => handleEdit(user)}
                >
                  編集
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                >
                  削除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー情報の編集</DialogTitle>
            <DialogDescription>
              更新したい項目のみ入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">メールアドレス</label>
              <Input
                className="col-span-3"
                value={editData.email || ''}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder={selectedUser?.email}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">新しいパスワード</label>
              <Input
                className="col-span-3"
                type="password"
                value={editData.password || ''}
                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                placeholder="変更する場合のみ入力"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">管理者権限</label>
              <Checkbox
                checked={editData.is_admin ?? selectedUser?.is_admin}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setEditData({ ...editData, is_admin: checked });
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate}>
              更新
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
