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
  id: string;
  date: string;
  muscle: string;
  exercise: string;
  sets: WorkoutSet[];
}

type Page = "home" | "workout" | "history" | "summary";
type UserStore = Record<string, WorkoutRecord[]>;
const STORE_KEY = "fitlog-user-store-v1";
const LEGACY_KEY = "fitness-workouts";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [activeUser, setActiveUser] = useState("默认用户");
  const [userStore, setUserStore] = useState<UserStore>({ "默认用户": [] });

  const ensureRecordId = (records: WorkoutRecord[]): WorkoutRecord[] =>
    records.map((record, idx) => ({
      ...record,
      id: record.id ?? `${record.date}-${record.exercise}-${idx}`,
    }));

  useEffect(() => {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { activeUser?: string; users?: UserStore };
        if (parsed?.users && Object.keys(parsed.users).length > 0) {
          const nextUsers = Object.fromEntries(
            Object.entries(parsed.users).map(([name, records]) => [name, ensureRecordId(records)])
          );
          setUserStore(nextUsers);
          setActiveUser(parsed.activeUser && nextUsers[parsed.activeUser] ? parsed.activeUser : Object.keys(nextUsers)[0]);
          return;
        }
      } catch (e) {
        console.error("Failed to load fitlog store", e);
      }
    }

    // Migration path for old single-user data
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      try {
        const records = ensureRecordId(JSON.parse(legacy) as WorkoutRecord[]);
        setUserStore({ "默认用户": records });
        setActiveUser("默认用户");
      } catch (e) {
        console.error("Failed to migrate legacy workouts", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        activeUser,
        users: userStore,
      })
    );
  }, [activeUser, userStore]);

  const workouts = userStore[activeUser] ?? [];

  const handleSaveWorkouts = (records: WorkoutRecord[]) => {
    setUserStore(prev => ({
      ...prev,
      [activeUser]: [...(prev[activeUser] ?? []), ...ensureRecordId(records)],
    }));
  };

  const handleDeleteWorkout = (workoutId: string) => {
    setUserStore(prev => ({
      ...prev,
      [activeUser]: (prev[activeUser] ?? []).filter(w => w.id !== workoutId),
    }));
  };

  const handleDeleteDateRecords = (dateKey: string) => {
    setUserStore(prev => ({
      ...prev,
      [activeUser]: (prev[activeUser] ?? []).filter(
        w => new Date(w.date).toLocaleDateString("zh-CN") !== dateKey
      ),
    }));
  };

  const handleCreateUser = (name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    setUserStore(prev => {
      if (prev[nextName]) return prev;
      return { ...prev, [nextName]: [] };
    });
    setActiveUser(nextName);
  };

  const handleDeleteCurrentUser = () => {
    const allUsers = Object.keys(userStore);
    if (allUsers.length <= 1) return;
    setUserStore(prev => {
      const next = { ...prev };
      delete next[activeUser];
      return next;
    });
    const fallback = allUsers.find(u => u !== activeUser);
    if (fallback) setActiveUser(fallback);
  };

  const getPersonalRecord = (muscle: string, exercise: string): number => {
    const relevant = workouts.filter(w => w.exercise === exercise);
    if (relevant.length === 0) return 0;
    if (muscle.includes("有氧")) {
      return Math.max(...relevant.flatMap(w => w.sets.map(s => s.duration ?? s.weight ?? 0)));
    }
    return Math.max(...relevant.flatMap(w => w.sets.map(s => s.weight ?? 0)));
  };

  return (
    <div className="size-full pb-36 preview-theme">
      <style>{`
        .preview-theme {
          background: #0b0b0e;
          color: #f8f8f8;
        }
        .preview-theme .bg-white,
        .preview-theme .bg-white\\/95,
        .preview-theme .bg-white\\/90,
        .preview-theme .bg-white\\/85,
        .preview-theme .bg-white\\/80,
        .preview-theme [class*="bg-slate-50"],
        .preview-theme [class*="bg-slate-100"] {
          background-color: #121217 !important;
        }
        .preview-theme [class*="text-slate-800"],
        .preview-theme [class*="text-slate-700"],
        .preview-theme [class*="text-slate-600"] {
          color: #f3f4f6 !important;
        }
        .preview-theme [class*="text-slate-500"],
        .preview-theme [class*="text-slate-400"] {
          color: #a1a1aa !important;
        }
        .preview-theme [class*="border-slate-"],
        .preview-theme [class*="border-blue-100"],
        .preview-theme [class*="border-indigo-100"] {
          border-color: #2a2a33 !important;
        }
      `}</style>
      {currentPage === "home" && (
        <HomePage
          onStartWorkout={() => setCurrentPage("workout")}
          workouts={workouts}
          currentUser={activeUser}
          users={Object.keys(userStore)}
          onSwitchUser={setActiveUser}
          onCreateUser={handleCreateUser}
          onDeleteCurrentUser={handleDeleteCurrentUser}
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
        <HistoryPage
          onBack={() => setCurrentPage("home")}
          workouts={workouts}
          onDeleteWorkout={handleDeleteWorkout}
          onDeleteDateRecords={handleDeleteDateRecords}
        />
      )}
      {currentPage === "summary" && (
        <SummaryPage onBack={() => setCurrentPage("home")} workouts={workouts} />
      )}

      <div
        className="fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-xl"
        style={{
          borderColor: "#2a2a33",
          background: "rgba(16,16,22,0.95)",
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1 px-2 py-2">
          {[
            { key: "home" as const, label: "首页", icon: "🏠" },
            { key: "workout" as const, label: "训练", icon: "🏋️" },
            { key: "history" as const, label: "历史", icon: "📈" },
            { key: "summary" as const, label: "总结", icon: "📊" },
          ].map(tab => {
            const active = currentPage === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCurrentPage(tab.key)}
                className={`rounded-xl py-2 text-center transition-all ${
                  active ? "text-black shadow-md" : "text-zinc-400 hover:bg-zinc-900"
                }`}
                style={active ? { background: "#c9ff2f" } : {}}
              >
                <div className="text-base leading-none">{tab.icon}</div>
                <div className="text-xs font-semibold mt-1">{tab.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
