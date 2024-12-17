import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, SkipForward, Timer } from "lucide-react";
import type { HabitGroup, ExecutionStatus } from '../types';

export default function ExecuteHabit() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<HabitGroup | null>(null);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}`);
      const data = await response.json();
      setGroup(data);
      startExecution();
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const startExecution = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error starting execution:', error);
    }
  };

  const completeHabit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/complete-current`, {
        method: 'POST',
      });
      const data = await response.json();
      setStatus(data);
      if (data.is_completed) {
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const skipHabit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/skip-current`, {
        method: 'POST',
      });
      const data = await response.json();
      setStatus(data);
      if (data.is_completed) {
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Error skipping habit:', error);
    }
  };

  if (!group || !status) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  const currentHabit = group.habits[status.current_habit_index];

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>
            {status.current_habit_index + 1} / {group.habits.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-2xl font-semibold">{currentHabit.name}</div>
            <div className="flex items-center text-muted-foreground">
              <Timer className="h-4 w-4 mr-2" />
              {currentHabit.duration_minutes}分
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={skipHabit}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            スキップ
          </Button>
          <Button
            variant="default"
            onClick={completeHabit}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            完了
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
