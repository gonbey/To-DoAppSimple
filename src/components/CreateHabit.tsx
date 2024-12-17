import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function CreateHabit() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [habitName, setHabitName] = useState('');
  const [duration, setDuration] = useState('');

  const createHabit = async () => {
    if (!habitName.trim() || !duration.trim()) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/habits/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: habitName,
          duration_minutes: parseInt(duration, 10)
        }),
      });
      navigate('/');
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>新規習慣登録</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>新規習慣</CardTitle>
          <CardDescription>新しい習慣を登録します。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habitName">習慣名</Label>
              <Input
                id="habitName"
                value={habitName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHabitName(e.target.value)}
                placeholder="瞑想"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">所要時間（分）</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createHabit}>
            <Plus className="h-4 w-4 mr-2" />
            登録
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
