import { useState, useEffect } from "react";
import { HomePage } from "./components/HomePage";
import { WorkoutPage } from "./components/WorkoutPage";
import { HistoryPage } from "./components/HistoryPage";
import { SummaryPage } from "./components/SummaryPage";

export interface WorkoutSet {
  weight?: number;
  reps?: number;
  duration?: number;
  intensity?: "easy" | "medium" | "hard";
}

export interface WorkoutRecord {
  date: string;
  muscle: string;
  exercise: string;
  sets: WorkoutSet[];
}

type Page = "home" | "workout" | "history" | "summary";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("fitness-workouts");
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load workouts", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fitness-workouts", JSON.stringify(workouts));
  }, [workouts]);

  const handleSaveWorkouts = (records: WorkoutRecord[]) => {
    setWorkouts(prev => [...prev, ...records]);
  };

  const getPersonalRecord = (muscle: string, exercise: string): number => {
    const relevant = workouts.filter(w => w.muscle === muscle && w.exercise === exercise);
    if (relevant.length === 0) return 0;
    if (muscle === "有氧") {
      return Math.max(...relevant.flatMap(w => w.sets.map(s => s.duration ?? s.weight ?? 0)));
    }
    return Math.max(...relevant.flatMap(w => w.sets.map(s => s.weight ?? 0)));
  };

  return (
    <div className="size-full">
      {currentPage === "home" && (
        <HomePage
          onStartWorkout={() => setCurrentPage("workout")}
          onViewHistory={() => setCurrentPage("history")}
          onViewSummary={() => setCurrentPage("summary")}
          workouts={workouts}
        />
      )}
      {currentPage === "workout" && (
        <WorkoutPage
          onBack={() => setCurrentPage("home")}
          onSaveWorkouts={handleSaveWorkouts}
          getPersonalRecord={getPersonalRecord}
        />
      )}
      {currentPage === "history" && (
        <HistoryPage onBack={() => setCurrentPage("home")} workouts={workouts} />
      )}
      {currentPage === "summary" && (
        <SummaryPage onBack={() => setCurrentPage("home")} workouts={workouts} />
      )}
    </div>
  );
}
