import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Calendar, TrendingUp, Trophy, Filter, ChevronDown, ChevronUp, Search, X, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { WorkoutRecord } from "../App";

const MUSCLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "胸":   { bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200",   dot: "bg-rose-500" },
  "背":   { bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200",   dot: "bg-blue-500" },
  "肩":   { bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200",  dot: "bg-amber-500" },
  "腿":   { bg: "bg-emerald-50", text: "text-emerald-600",border: "border-emerald-200",dot: "bg-emerald-500" },
  "手臂": { bg: "bg-purple-50",  text: "text-purple-600", border: "border-purple-200", dot: "bg-purple-500" },
  "有氧": { bg: "bg-teal-50",    text: "text-teal-600",   border: "border-teal-200",   dot: "bg-teal-500" },
};

const MUSCLE_HEX: Record<string, string> = {
  "胸":"#ef4444","背":"#2563eb","肩":"#d97706","腿":"#059669",
  "手臂":"#7c3aed","有氧":"#0891b2",
};

const MUSCLE_EMOJI: Record<string, string> = {
  "胸":"💪","背":"🎯","肩":"🔺","腿":"🦵","手臂":"💪","有氧":"🏃",
};

interface HistoryPageProps {
  onBack: () => void;
  workouts: WorkoutRecord[];
  onDeleteWorkout: (workoutId: string) => void;
  onDeleteDateRecords: (dateKey: string) => void;
}

export function HistoryPage({ onBack, workouts, onDeleteWorkout, onDeleteDateRecords }: HistoryPageProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [rangeDays, setRangeDays] = useState<7 | 30 | 0>(0);

  const normalizeMuscle = (muscle: string) => (muscle.includes("有氧") ? "有氧" : muscle);
  const allMuscles = [...new Set(workouts.map(w => w.muscle))];
  const rangeStart = rangeDays > 0 ? new Date(Date.now() - rangeDays * 86400000) : null;
  const filtered = workouts.filter(w => {
    if (filterMuscle && w.muscle !== filterMuscle) return false;
    if (rangeStart && new Date(w.date) < rangeStart) return false;
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      return w.exercise.toLowerCase().includes(kw) || w.muscle.toLowerCase().includes(kw);
    }
    return true;
  });

  const byDate = filtered.reduce((acc, w) => {
    const d = new Date(w.date).toLocaleDateString("zh-CN");
    acc[d] = acc[d] ? [...acc[d], w] : [w];
    return acc;
  }, {} as Record<string, WorkoutRecord[]>);

  const sortedDates = Object.entries(byDate).sort(
    ([a], [b]) => new Date(b.replace(/\//g, "-")).getTime() - new Date(a.replace(/\//g, "-")).getTime()
  );

  // Trend chart (last 12 strength workouts)
  const chartData = workouts
    .filter(w => !w.muscle.includes("有氧"))
    .slice(-12)
    .map((w, i) => ({
      n: `#${i + 1}`,
      最大重量: Math.max(...w.sets.map(s => s.weight ?? 0)),
      date: new Date(w.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
    }));

  // PR records
  const prs = workouts.reduce((acc, w) => {
    const key = `${w.muscle}|${w.exercise}`;
    const max = Math.max(
      ...w.sets.map(s => (w.muscle.includes("有氧") ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0)))
    );
    if (!acc[key] || max > acc[key]) acc[key] = max;
    return acc;
  }, {} as Record<string, number>);

  const prEntries = Object.entries(prs).sort(([, a], [, b]) => b - a).slice(0, 8);
  const strengthVolume = filtered
    .filter(w => !w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);
  const cardioMinutes = filtered
    .filter(w => w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
  const e1rm = filtered
    .filter(w => !w.muscle.includes("有氧"))
    .flatMap(w => w.sets.map(set => {
      const weight = set.weight ?? 0;
      const reps = set.reps ?? 0;
      return reps > 0 ? weight * (1 + reps / 30) : 0;
    }));
  const bestE1RM = e1rm.length > 0 ? Math.max(...e1rm) : 0;

  const loadTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const ds = d.toLocaleDateString("zh-CN");
    const dayWorkouts = filtered.filter(w => new Date(w.date).toLocaleDateString("zh-CN") === ds);
    const dayStrength = dayWorkouts
      .filter(w => !w.muscle.includes("有氧"))
      .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);
    const dayCardio = dayWorkouts
      .filter(w => w.muscle.includes("有氧"))
      .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
    return {
      d: d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
      负荷: Number((dayStrength / 120 + dayCardio * 0.8).toFixed(1)),
    };
  });

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at top, #1a1a24 0%, #0b0b0f 55%, #08080b 100%)" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-blue-100/80"
        style={{ background: "rgba(14,14,20,0.9)", backdropFilter: "blur(16px)", borderColor: "#2a2a33" }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </motion.button>
            <div className="flex-1">
              <h1 className="font-black text-slate-800 text-base">训练历史</h1>
              <p className="text-xs text-slate-500">{workouts.length} 条训练记录</p>
            </div>
            {allMuscles.length > 1 && (
              <button onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  filterMuscle
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}>
                <Filter className="w-3.5 h-3.5" />
                {filterMuscle ?? "筛选"}
              </button>
            )}
          </div>

          {/* Filter chips */}
          <AnimatePresence>
            {showFilter && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="flex gap-2 flex-wrap pt-3 pb-1">
                  <button onClick={() => setFilterMuscle(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                      !filterMuscle ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600"
                    }`}>全部</button>
                  {allMuscles.map(m => {
                    const mc = MUSCLE_COLORS[normalizeMuscle(m)];
                    return (
                      <button key={m} onClick={() => { setFilterMuscle(filterMuscle === m ? null : m); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all flex items-center gap-1 ${
                          filterMuscle === m
                            ? `${mc?.bg} ${mc?.text} ${mc?.border}`
                            : "bg-white border-slate-200 text-slate-600"
                        }`}>
                        {MUSCLE_EMOJI[normalizeMuscle(m)]} {m}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索动作或部位"
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
          <div className="mt-2.5 flex gap-2">
            {[
              { label: "近7天", days: 7 as const },
              { label: "近30天", days: 30 as const },
              { label: "全部", days: 0 as const },
            ].map(opt => (
              <motion.button
                key={opt.label}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setRangeDays(opt.days)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  rangeDays === opt.days
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-28">
        {workouts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl bg-white shadow-sm border border-slate-100">📭</div>
            <p className="font-bold text-slate-700">暂无训练记录</p>
            <p className="text-slate-400 text-sm mt-1">完成第一次训练后即可查看</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2.5 mb-4"
            >
              {[
                { label: "力量总容量", value: Math.round(strengthVolume), unit: "kg", c: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
                { label: "有氧总时长", value: Math.round(cardioMinutes), unit: "min", c: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
                { label: "最佳估算1RM", value: Math.round(bestE1RM), unit: "kg", c: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl border p-3 text-center ${s.bg}`}>
                  <div className={`font-black text-xl ${s.c}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.unit} · {s.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
              style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">训练负荷趋势</h2>
                  <p className="text-xs text-slate-400">近14天（力量+有氧综合负荷）</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={loadTrend} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                  <defs>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="d" stroke="#cbd5e1" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                  />
                  <Area type="monotone" dataKey="负荷" stroke="#0ea5e9" strokeWidth={2.4} fill="url(#loadGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Trend chart */}
            {chartData.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
                style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">力量趋势</h2>
                    <p className="text-xs text-slate-400">近 {chartData.length} 条记录</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                      labelStyle={{ color: "#64748b" }} />
                    <Area type="monotone" dataKey="最大重量" stroke="#2563eb" strokeWidth={2.5} fill="url(#blueGrad)"
                      dot={{ fill: "#2563eb", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#4f46e5" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* PR Records */}
            {prEntries.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
                style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">个人最高纪录</h2>
                    <p className="text-xs text-slate-400">PR 排行榜</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {prEntries.map(([key, w]) => {
                    const [muscle, exercise] = key.split("|");
                    const base = normalizeMuscle(muscle);
                    const mc = MUSCLE_COLORS[base];
                    const hex = MUSCLE_HEX[base];
                    const isCardio = muscle.includes("有氧");
                    return (
                      <div key={key}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${mc?.bg} ${mc?.border}`}>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <span>{MUSCLE_EMOJI[base]}</span>{muscle}
                          </div>
                          <div className="font-bold text-slate-800 text-sm truncate">{exercise}</div>
                        </div>
                        <div className="font-black text-sm flex-shrink-0" style={{ color: hex }}>
                          {w}{isCardio ? "min" : "kg"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Timeline */}
            <div className="space-y-2.5">
              {sortedDates.length === 0 ? (
                <div className="text-center py-10 text-slate-400">该部位暂无记录</div>
              ) : sortedDates.map(([date, records], idx) => (
                <motion.div key={date}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                >
                  <button onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                    className="w-full flex items-center gap-3.5 p-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #1a1a26, #11111c)", border: "1px solid #3a3a52" }}>
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-slate-800 text-sm">{date}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {records.length} 个动作 · {records.reduce((s, r) => s + r.sets.length, 0)} 组
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定删除 ${date} 的全部训练记录吗？`)) onDeleteDateRecords(date);
                        }}
                        className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100"
                        title="删除当天全部记录"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                      {/* Muscle dot indicators */}
                      <div className="flex -space-x-0.5">
                        {[...new Set(records.map(r => r.muscle))].slice(0, 4).map((m, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 border-white ${MUSCLE_COLORS[normalizeMuscle(m)]?.dot ?? "bg-slate-400"}`} />
                        ))}
                      </div>
                      {expandedDate === date
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedDate === date && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2">
                          {records.map((r, i) => {
                            const base = normalizeMuscle(r.muscle);
                            const isCardio = r.muscle.includes("有氧");
                            const mc = MUSCLE_COLORS[base];
                            const hex = MUSCLE_HEX[base];
                            return (
                              <div key={i} className={`p-3.5 rounded-xl border ${mc?.bg} ${mc?.border}`}>
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span className="text-base">{MUSCLE_EMOJI[base]}</span>
                                  <span className="font-bold text-slate-800 text-sm">{r.exercise}</span>
                                  <span className={`ml-auto text-xs font-semibold ${mc?.text}`}>{r.muscle}</span>
                                  <button
                                    onClick={() => {
                                      if (confirm(`删除动作「${r.exercise}」的该条记录？`)) {
                                        onDeleteWorkout(r.id);
                                      }
                                    }}
                                    className="w-6 h-6 rounded-md bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100"
                                    title="删除该条记录"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {r.sets.map((set, si) => (
                                    <span key={si}
                                      className="text-xs px-2.5 py-1.5 rounded-xl font-semibold border bg-white"
                                      style={{ color: hex, borderColor: `${hex}30` }}>
                                      {isCardio
                                        ? `${set.duration ?? set.weight ?? 0}min`
                                        : `${set.weight ?? 0}kg×${set.reps ?? 0}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
