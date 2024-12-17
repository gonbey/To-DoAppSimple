import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/use-toast";
import { X } from "lucide-react";

interface TodoFormData {
  title: string;
  status: '未完了' | '進行中' | '完了';
  deadline: string;
  content: string;
  tags: string[];
}

const initialFormData: TodoFormData = {
  title: '',
  status: '未完了',
  deadline: new Date().toISOString().split('T')[0],
  content: '',
  tags: []
};

export function TodoForm() {
  const [formData, setFormData] = useState<TodoFormData>(initialFormData);
  const [newTag, setNewTag] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchTodo();
    }
  }, [id]);

  const fetchTodo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/todos/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error('Todoの取得に失敗しました。');

      const todo = await response.json();
      setFormData({
        ...todo,
        deadline: new Date(todo.deadline).toISOString().split('T')[0]
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "Todoの取得に失敗しました。",
        variant: "destructive",
      });
      navigate('/todos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isEditing
      ? `${import.meta.env.VITE_API_URL}/api/todos/${id}`
      : `${import.meta.env.VITE_API_URL}/api/todos`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('保存に失敗しました。');

      toast({
        title: "成功",
        description: `Todoを${isEditing ? '更新' : '作成'}しました。`,
      });
      navigate('/todos');
    } catch (error) {
      toast({
        title: "エラー",
        description: `Todoの${isEditing ? '更新' : '作成'}に失敗しました。`,
        variant: "destructive",
      });
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(newTag.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Todo編集' : '新規Todo作成'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">タイトル</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">ステータス</label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="未完了">未完了</SelectItem>
              <SelectItem value="進行中">進行中</SelectItem>
              <SelectItem value="完了">完了</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">期限</label>
          <Input
            type="date"
            value={formData.deadline}
            onChange={(e) => {
              const date = new Date(e.target.value);
              setFormData({ ...formData, deadline: date.toISOString().split('T')[0] });
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">詳細内容</label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">タグ</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="タグを入力してEnterで追加"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/todos')}
          >
            キャンセル
          </Button>
          <Button type="submit">
            {isEditing ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </div>
  );
}
