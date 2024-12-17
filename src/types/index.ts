export interface Habit {
  id: string;
  name: string;
  duration_minutes: number;
  created_at: string;
  order: number;
}

export interface HabitGroup {
  id: string;
  name: string;
  created_at: string;
  habits: Habit[];
}

export interface ExecutionStatus {
  group_id: string;
  current_habit_index: number;
  completed_habits: string[];
  skipped_habits: string[];
  is_completed: boolean;
}
