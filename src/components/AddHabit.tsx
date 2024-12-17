import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Loader2 } from "lucide-react";

interface AddHabitProps {
  groupId: string;
  onAdd: () => void;
}

export const AddHabit: React.FC<AddHabitProps> = ({ groupId, onAdd }) => {
  const [habitName, setHabitName] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/habits/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: habitName,
          duration_minutes: parseInt(duration),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || '習慣の追加に失敗しました');
      }

      setHabitName('');
      setDuration('');
      onAdd();
    } catch (error) {
      console.error('Error creating habit:', error);
      setError(error instanceof Error ? error.message : '習慣の追加中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="habitName">習慣名</Label>
        <Input
          id="habitName"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          placeholder="朝のストレッチ"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration">所要時間（分）</Label>
        <Input
          type="number"
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="15"
          required
          min="1"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            追加中...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            追加
          </>
        )}
      </Button>
    </form>
  );
};
