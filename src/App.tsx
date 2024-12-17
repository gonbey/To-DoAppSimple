import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import HabitGroups from './components/HabitGroups';
import CreateHabit from './components/CreateHabit';
import ExecuteHabit from './components/ExecuteHabit';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex justify-between items-center">
              <Link to="/" className="text-xl font-bold">
                習慣トラッカー
              </Link>
              <Link to="/create">
                <Button>
                  新規グループ
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HabitGroups />} />
            <Route path="/create" element={<HabitGroups isCreating={true} />} />
            <Route path="/groups/:groupId/habits/create" element={<CreateHabit />} />
            <Route path="/execute/:groupId" element={<ExecuteHabit />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
