import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayCircle, Plus, Trash } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import type { HabitGroup } from '../types';
import { AddHabit } from './AddHabit';

interface HabitGroupsProps {
  isCreating?: boolean;
}

export default function HabitGroups({ isCreating = false }: HabitGroupsProps) {
  const [groups, setGroups] = useState<HabitGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/`);
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      const newGroup = await response.json();
      setGroups([...groups, newGroup]);
      setNewGroupName('');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}`, {
        method: 'DELETE',
      });
      setGroups(groups.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const startExecution = (groupId: string) => {
    navigate(`/execute/${groupId}`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{isCreating ? '新規グループ作成' : 'ホーム'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>新規習慣グループ</CardTitle>
            <CardDescription>新しい習慣グループを作成します。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">グループ名</Label>
                <Input
                  id="groupName"
                  value={newGroupName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupName(e.target.value)}
                  placeholder="朝のルーティン"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={createGroup}>
              <Plus className="h-4 w-4 mr-2" />
              作成
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>{group.habits.length}個の習慣</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.habits.map((habit) => (
                  <li key={habit.id} className="text-sm">
                    {habit.name} ({habit.duration_minutes}分)
                  </li>
                ))}
              </ul>
              {selectedGroupId === group.id ? (
                <div className="mt-4">
                  <AddHabit
                    groupId={group.id}
                    onAdd={() => {
                      fetchGroups();
                      setSelectedGroupId(null);
                    }}
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  習慣を追加
                </Button>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteGroup(group.id)}
              >
                <Trash className="h-4 w-4 mr-2" />
                削除
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => startExecution(group.id)}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                開始
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
