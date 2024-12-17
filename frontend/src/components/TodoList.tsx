import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/use-toast";
import { Pencil, Trash2 } from "lucide-react";

interface Todo {
  id: number;
  title: string;
  status: '未完了' | '進行中' | '完了';
  deadline: string;
  content: string;
  tags: string[];
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/todos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();
      setTodos(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "Todoの取得に失敗しました。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleStatusChange = async (todoId: number, newStatus: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('更新に失敗しました。');

      toast({
        title: "成功",
        description: "Todoのステータスを更新しました。",
      });
      fetchTodos();
    } catch (error) {
      toast({
        title: "エラー",
        description: "ステータスの更新に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (todoId: number) => {
    if (!confirm('このTodoを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('削除に失敗しました。');

      toast({
        title: "成功",
        description: "Todoを削除しました。",
      });
      fetchTodos();
    } catch (error) {
      toast({
        title: "エラー",
        description: "Todoの削除に失敗しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Todo一覧</h2>
        <Button onClick={() => navigate('/todo/new', { replace: true })}>
          新規作成
        </Button>
      </div>

      <Table>
        <TableCaption>あなたのTodo一覧</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>タイトル</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>期限</TableHead>
            <TableHead>タグ</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todos.map((todo) => (
            <TableRow key={todo.id}>
              <TableCell className="font-medium">{todo.title}</TableCell>
              <TableCell>
                <Select
                  value={todo.status}
                  onValueChange={(value) => handleStatusChange(todo.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>{todo.status}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未完了">未完了</SelectItem>
                    <SelectItem value="進行中">進行中</SelectItem>
                    <SelectItem value="完了">完了</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{new Date(todo.deadline).toISOString().slice(0, 10)}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {todo.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/todo/${todo.id}`, { replace: true })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
