import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Award, Calendar, Flame, TrendingUp, Zap, Star, Target, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import type { WorkoutRecord } from "../App";
import { BOTTOM_SPACING } from "../layoutSpacing";

const PIE_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#ef4444", "#ea580c"];

const MUSCLE_EMOJI: Record<string, string> = {
  "胸":"💪","背":"🎯","肩":"🔺","腿":"🦵","手臂":"💪","有氧":"🏃",
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit: string;
  gradient: string;
  shadow: string;
  delay?: number;
}

function StatCard({ icon, label, value, unit, gradient, shadow, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 240, damping: 22 }}
      className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: gradient, boxShadow: shadow }}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/8" />
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">{icon}</div>
        <div className="text-3xl font-black">{value}<span className="text-base font-semibold opacity-75 ml-1">{unit}</span></div>
        <div className="text-sm opacity-80 mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

interface SummaryPageProps {
  onBack: () => void;
  workouts: WorkoutRecord[];
}

export function SummaryPage({ onBack, workouts }: SummaryPageProps) {
  const [compareStartKey, setCompareStartKey] = useState<string | null>(null);
  const [compareEndKey, setCompareEndKey] = useState<string | null>(null);
  const normalizeMuscle = (muscle: string) => (muscle.includes("有氧") ? "有氧" : muscle);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
  const monthWorkouts = workouts.filter(w => new Date(w.date) >= monthAgo);
  const weekDays = new Set(weekWorkouts.map(w => new Date(w.date).toLocaleDateString("zh-CN"))).size;

  const streak = (() => {
    let count = 0;
    const d = new Date(now); d.setHours(0,0,0,0);
    while (true) {
      const has = workouts.some(w => { const wd = new Date(w.date); wd.setHours(0,0,0,0); return wd.getTime() === d.getTime(); });
      if (!has) break;
      count++; d.setTime(d.getTime() - 86400000);
    }
    return count;
  })();

  const prBreaks = monthWorkouts.filter((w, idx, arr) => {
    const max = Math.max(...w.sets.map(s => w.muscle.includes("有氧") ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0)));
    const prev = arr.slice(0, idx).filter(p => p.exercise === w.exercise);
    if (!prev.length) return false;
    return max > Math.max(
      ...prev.flatMap(p => p.sets.map(s => p.muscle.includes("有氧") ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0)))
    );
  }).length;

  const totalVolume = monthWorkouts
    .filter(w => !w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);

  const cardioMinutes = monthWorkouts
    .filter(w => w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
  const strengthSessions = monthWorkouts.filter(w => !w.muscle.includes("有氧")).length;
  const cardioSessions = monthWorkouts.filter(w => w.muscle.includes("有氧")).length;
  const consistencyScore = Math.min(100, Math.round((new Set(monthWorkouts.map(w => new Date(w.date).toLocaleDateString("zh-CN"))).size / 30) * 100));

  // Weekly bar chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000);
    const ds = d.toLocaleDateString("zh-CN");
    const dayWs = workouts.filter(w => new Date(w.date).toLocaleDateString("zh-CN") === ds);
    return {
      name: `周${"日一二三四五六"[d.getDay()]}`,
      力量: dayWs.filter(w => !w.muscle.includes("有氧")).length,
      有氧分钟: dayWs
        .filter(w => w.muscle.includes("有氧"))
        .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0),
    };
  });

  const oneRMByExercise = monthWorkouts
    .filter(w => !w.muscle.includes("有氧"))
    .reduce((acc, w) => {
      const est = Math.max(...w.sets.map(set => {
        const weight = set.weight ?? 0;
        const reps = set.reps ?? 0;
        return reps > 0 ? weight * (1 + reps / 30) : 0;
      }));
      if (!acc[w.exercise] || est > acc[w.exercise]) acc[w.exercise] = est;
      return acc;
    }, {} as Record<string, number>);

  const oneRMData = Object.entries(oneRMByExercise)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([exercise, value]) => ({ exercise: exercise.length > 6 ? `${exercise.slice(0, 6)}..` : exercise, 估算1RM: Math.round(value) }));

  const monthStrengthByExercise = monthWorkouts
    .filter(w => !w.muscle.includes("有氧"))
    .reduce((acc, w) => {
      const cur = Math.max(...w.sets.map(set => set.weight ?? 0));
      const prev = acc[w.exercise] ?? 0;
      acc[w.exercise] = Math.max(prev, cur);
      return acc;
    }, {} as Record<string, number>);
  const improvedCount = Object.values(monthStrengthByExercise).filter(v => v > 0).length;
  const overloadRate = improvedCount === 0 ? 0 : Math.round((prBreaks / improvedCount) * 100);

  const sessionDates = [...new Set(monthWorkouts.map(w => new Date(w.date).toLocaleDateString("zh-CN")))]
    .map(d => new Date(d.replace(/\//g, "-")).getTime())
    .sort((a, b) => a - b);
  const avgGap = sessionDates.length < 2
    ? 0
    : sessionDates.slice(1).reduce((sum, t, i) => sum + (t - sessionDates[i]) / 86400000, 0) / (sessionDates.length - 1);
  const rhythmScore = avgGap === 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - Math.abs(avgGap - 2) * 25)));
  const avgIntensityScore = (() => {
    const intensityMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
    const all = monthWorkouts.flatMap(w => w.sets.map(s => intensityMap[s.intensity ?? "medium"] ?? 2));
    if (!all.length) return 0;
    return Number((all.reduce((a, b) => a + b, 0) / all.length).toFixed(2));
  })();
  const focusType = (() => {
    if (strengthSessions === 0 && cardioSessions === 0) return "未形成训练习惯";
    if (strengthSessions > cardioSessions * 1.6) return "力量主导型";
    if (cardioSessions > strengthSessions * 1.6) return "心肺主导型";
    return "均衡发展型";
  })();
  const profileLevel = (() => {
    const score =
      consistencyScore * 0.35 +
      overloadRate * 0.25 +
      rhythmScore * 0.2 +
      Math.min(100, cardioMinutes / 1.8) * 0.2;
    if (score >= 80) return "进阶训练者";
    if (score >= 55) return "稳定训练者";
    return "起步训练者";
  })();

  const monthlyGrowthData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const monthRecords = workouts.filter(w => {
      const t = new Date(w.date).getTime();
      return t >= monthStart.getTime() && t < monthEnd.getTime();
    });
    const sessions = monthRecords.length;
    const strengthVolume = monthRecords
      .filter(w => !w.muscle.includes("有氧"))
      .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);
    const cardioMins = monthRecords
      .filter(w => w.muscle.includes("有氧"))
      .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
    return {
      month: `${monthDate.getMonth() + 1}月`,
      训练次数: sessions,
      训练负荷指数: Number((strengthVolume / 1000 + cardioMins / 30).toFixed(1)),
    };
  });

  const totalAllSessions = workouts.length;
  const totalAllStrengthVolume = workouts
    .filter(w => !w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);
  const totalAllCardioMinutes = workouts
    .filter(w => w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getMonthMetrics = (base: Date) => {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    const chunk = workouts.filter(w => {
      const t = new Date(w.date).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
    return {
      sessions: chunk.length,
      strengthVolume: chunk
        .filter(w => !w.muscle.includes("有氧"))
        .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0),
      cardioMinutes: chunk
        .filter(w => w.muscle.includes("有氧"))
        .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0),
    };
  };
  const firstWorkoutDate = sortedWorkouts[0] ? new Date(sortedWorkouts[0].date) : null;
  const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthOptions = (() => {
    const start = firstWorkoutDate
      ? new Date(firstWorkoutDate.getFullYear(), firstWorkoutDate.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    const list: Array<{ key: string; label: string; date: Date }> = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      list.push({
        key: toMonthKey(cursor),
        label: `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`,
        date: new Date(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return list;
  })();
  const defaultStartKey = monthOptions[0]?.key ?? toMonthKey(now);
  const defaultEndKey = monthOptions[monthOptions.length - 1]?.key ?? toMonthKey(now);
  const selectedStartKey = monthOptions.some(m => m.key === compareStartKey) ? compareStartKey! : defaultStartKey;
  const selectedEndKey = monthOptions.some(m => m.key === compareEndKey) ? compareEndKey! : defaultEndKey;
  const selectedStartOption = monthOptions.find(m => m.key === selectedStartKey) ?? monthOptions[0];
  const selectedEndOption = monthOptions.find(m => m.key === selectedEndKey) ?? monthOptions[monthOptions.length - 1];
  const startMonthMetrics = selectedStartOption ? getMonthMetrics(selectedStartOption.date) : getMonthMetrics(now);
  const endMonthMetrics = selectedEndOption ? getMonthMetrics(selectedEndOption.date) : getMonthMetrics(now);
  const getGrowthPercent = (base: number, current: number) => {
    if (base <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - base) / base) * 100);
  };
  const growthCompare = [
    { label: "训练次数", first: startMonthMetrics.sessions, current: endMonthMetrics.sessions, unit: "次" },
    { label: "力量总量", first: Math.round(startMonthMetrics.strengthVolume), current: Math.round(endMonthMetrics.strengthVolume), unit: "kg" },
    { label: "有氧时长", first: Math.round(startMonthMetrics.cardioMinutes), current: Math.round(endMonthMetrics.cardioMinutes), unit: "min" },
  ];

  // Muscle distribution pie
  const muscleDist = monthWorkouts.reduce((acc, w) => {
    const key = normalizeMuscle(w.muscle);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(muscleDist).sort(([,a],[,b]) => b-a)
    .map(([name, value]) => ({ name: `${MUSCLE_EMOJI[name] ?? ""} ${name}`, value }));

  // Infinite achievements (grow without an upper limit)
  const uniqueExerciseCount = new Set(workouts.map(w => w.exercise)).size;
  const getInfiniteTier = (value: number, baseTarget: number, growth: number) => {
    let level = 0;
    let nextTarget = baseTarget;
    while (value >= nextTarget) {
      level += 1;
      nextTarget = Math.round(baseTarget * Math.pow(growth, level));
      if (level > 500) break;
    }
    const prevTarget = level === 0 ? 0 : Math.round(baseTarget * Math.pow(growth, level - 1));
    const span = Math.max(1, nextTarget - prevTarget);
    const progress = Math.max(0, Math.min(1, (value - prevTarget) / span));
    return { level, nextTarget, progress };
  };
  const infiniteAchievements = [
    {
      key: "streak",
      icon: "🔥",
      title: "连续训练次数",
      desc: "连续打卡天数越高，等级持续提升",
      value: streak,
      unit: "天",
      ...getInfiniteTier(streak, 3, 1.5),
    },
    {
      key: "strength",
      icon: "🏋️",
      title: "力量训练总重量",
      desc: "累计力量总量（weight × reps）",
      value: Math.round(totalAllStrengthVolume),
      unit: "kg",
      ...getInfiniteTier(totalAllStrengthVolume, 2000, 1.6),
    },
    {
      key: "exercise",
      icon: "🧩",
      title: "解锁训练动作",
      desc: "完成过的不同动作名称数量",
      value: uniqueExerciseCount,
      unit: "个",
      ...getInfiniteTier(uniqueExerciseCount, 8, 1.4),
    },
    {
      key: "cardio",
      icon: "🏃",
      title: "有氧累计时长",
      desc: "累计有氧训练时长",
      value: Math.round(totalAllCardioMinutes),
      unit: "min",
      ...getInfiniteTier(totalAllCardioMinutes, 180, 1.6),
    },
  ];
  const totalAchievementLevel = infiniteAchievements.reduce((sum, item) => sum + item.level, 0);
  const avgAchievementProgress = infiniteAchievements.length
    ? infiniteAchievements.reduce((sum, item) => sum + item.progress, 0) / infiniteAchievements.length
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at top, #1a1a24 0%, #0b0b0f 55%, #08080b 100%)" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-blue-100/80"
        style={{ background: "rgba(14,14,20,0.9)", backdropFilter: "blur(16px)", borderColor: "#2a2a33" }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </motion.button>
          <div>
            <h1 className="font-black text-slate-800 text-base">周期总结</h1>
            <p className="text-xs text-slate-500">近30天数据分析</p>
          </div>
        </div>
      </div>

      <div
        className="max-w-lg mx-auto px-4 py-5"
        style={{ paddingBottom: BOTTOM_SPACING.pageContent }}
      >
        {workouts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl bg-white shadow-sm border border-slate-100">📊</div>
            <p className="font-bold text-slate-700">暂无训练数据</p>
            <p className="text-slate-400 text-sm mt-1">开始训练后即可查看统计</p>
          </motion.div>
        ) : (
          <>
            {/* Stat cards grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard
                icon={<Calendar className="w-4 h-4 text-white" />}
                label="本周训练天数" value={weekDays} unit="天"
                gradient="linear-gradient(135deg, #2563eb, #4f46e5)"
                shadow="0 8px 28px rgba(37,99,235,0.4)" delay={0} />
              <StatCard
                icon={<Flame className="w-4 h-4 text-white" />}
                label="连续打卡天数" value={streak} unit="天"
                gradient="linear-gradient(135deg, #ea580c, #ef4444)"
                shadow="0 8px 28px rgba(234,88,12,0.4)" delay={0.06} />
              <StatCard
                icon={<Award className="w-4 h-4 text-white" />}
                label="本月PR次数" value={prBreaks} unit="次"
                gradient="linear-gradient(135deg, #d97706, #f59e0b)"
                shadow="0 8px 28px rgba(217,119,6,0.4)" delay={0.12} />
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                label="本月训练量" value={(totalVolume / 1000).toFixed(1)} unit="吨"
                gradient="linear-gradient(135deg, #7c3aed, #6366f1)"
                shadow="0 8px 28px rgba(124,58,237,0.4)" delay={0.18} />
            </div>

            {/* Mini stats */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, val: cardioMinutes, label: "有氧分钟", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
                { icon: <Target className="w-3.5 h-3.5" />, val: monthWorkouts.length, label: "本月记录", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
                { icon: <Star className="w-3.5 h-3.5" />, val: Object.keys(muscleDist).length, label: "训练部位", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3.5 text-center border"
                  style={{ background: s.bg, borderColor: s.border, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex justify-center mb-1.5" style={{ color: s.color }}>{s.icon}</div>
                  <div className="font-black text-xl" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
              style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="inline-block h-5 w-1 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(201,255,47,0.55)]" />
                    <h2 className="font-black text-zinc-100 text-sm">长期成长轨迹</h2>
                  </div>
                  <p className="text-xs text-zinc-300">过去6个月训练次数与负荷变化</p>
                </div>
                <span className="text-xs text-lime-300 font-semibold">{profileLevel}</span>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={monthlyGrowthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="训练次数" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="训练负荷指数" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-400">累计训练</p>
                  <p className="font-black text-slate-700">{totalAllSessions} 次</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-400">累计力量总量</p>
                  <p className="font-black text-slate-700">{Math.round(totalAllStrengthVolume)} kg</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-400">累计有氧时长</p>
                  <p className="font-black text-slate-700">{Math.round(totalAllCardioMinutes)} min</p>
                </div>
              </div>
            </motion.div>

            {growthCompare.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
                style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block h-5 w-1 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(201,255,47,0.55)]" />
                    <h2 className="font-black text-zinc-100 text-sm">成长对比卡</h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {selectedStartOption?.label ?? "起点月"} vs {selectedEndOption?.label ?? "当前月"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className="text-xs text-slate-500">
                    起点月
                    <select
                      value={selectedStartKey}
                      onChange={(e) => setCompareStartKey(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700"
                    >
                      {monthOptions.map(opt => (
                        <option key={`start-${opt.key}`} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-500">
                    对比月
                    <select
                      value={selectedEndKey}
                      onChange={(e) => setCompareEndKey(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700"
                    >
                      {monthOptions.map(opt => (
                        <option key={`end-${opt.key}`} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="space-y-2.5">
                  {growthCompare.map(item => {
                    const pct = getGrowthPercent(item.first, item.current);
                    const up = pct >= 0;
                    return (
                      <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-500"}`}>
                            {up ? "+" : ""}{pct}%
                          </p>
                        </div>
                        <p className="text-sm font-bold text-slate-700 mt-1">
                          {item.first}{item.unit} → {item.current}{item.unit}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Weekly bar chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
              style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block h-5 w-1 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(201,255,47,0.55)]" />
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-100 text-sm">本周训练频率</h2>
                  <p className="text-xs text-zinc-300">过去7天数据</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="力量" fill="#2563eb" radius={[5, 5, 0, 0]} stackId="a" />
                  <Bar dataKey="有氧分钟" fill="#0891b2" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {[{ c: "#2563eb", l: "力量训练（次数）" }, { c: "#0891b2", l: "有氧（分钟）" }].map(x => (
                  <div key={x.l} className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 rounded-sm" style={{ background: x.c }} />{x.l}
                  </div>
                ))}
              </div>
            </motion.div>

            {oneRMData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
                style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block h-5 w-1 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(201,255,47,0.55)]" />
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-zinc-100 text-sm">力量能力画像</h2>
                    <p className="text-xs text-zinc-300">动作估算1RM（Epley）Top {oneRMData.length}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={oneRMData} margin={{ top: 4, right: 6, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="exercise" stroke="#cbd5e1" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="估算1RM" fill="#16a34a" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Pie chart */}
            {pieData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}
                className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
                style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block h-5 w-1 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(201,255,47,0.55)]" />
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-zinc-100 text-sm">本月部位分布</h2>
                    <p className="text-xs text-zinc-300">各部位训练占比</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                      dataKey="value" labelLine={false}
                      label={({ percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ""}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                    <Legend formatter={v => <span style={{ fontSize: "11px", color: "#64748b" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
              style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
              <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-500">训练画像</p>
                    <p className="font-black text-indigo-700 mt-0.5">{profileLevel} · {focusType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-400">平均强度</p>
                    <p className="font-bold text-indigo-700">{avgIntensityScore || "--"} / 3</p>
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-2 leading-relaxed">
                  {focusType === "力量主导型" && "你的训练明显偏向力量提升，建议每周补充2次中低强度有氧。"}
                  {focusType === "心肺主导型" && "你更偏向有氧耐力，建议加入基础抗阻训练以保护关节并提高代谢。"}
                  {focusType === "均衡发展型" && "训练结构较均衡，建议保持并按周期逐步提高主项负荷。"}
                  {focusType === "未形成训练习惯" && "先建立固定训练频率，再逐步提高强度和训练总量。"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">力量 / 有氧 会话比</p>
                  <p className="font-black text-slate-700 mt-1">{strengthSessions} : {cardioSessions}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">平均训练间隔</p>
                  <p className="font-black text-slate-700 mt-1">{avgGap ? `${avgGap.toFixed(1)} 天` : "--"}</p>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
              className="bg-white rounded-3xl border border-slate-100 p-5"
              style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-5 w-1 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(201,255,47,0.55)]" />
                  <div className="w-8 h-8 rounded-xl bg-lime-300/20 border border-lime-300/40 flex items-center justify-center">
                    <Award className="w-4 h-4 text-lime-300" />
                  </div>
                  <div>
                    <h2 className="font-black text-zinc-100 text-sm">成就系统（无限成长）</h2>
                    <p className="text-xs text-zinc-300">累计等级 Lv.{totalAchievementLevel}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-lime-300">{Math.round(avgAchievementProgress * 100)}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-zinc-800 rounded-full mb-5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${avgAchievementProgress * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #d9ff63, #c9ff2f)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {infiniteAchievements.map((a, i) => (
                  <motion.div key={a.key}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.38 + i * 0.05 }}
                    className="p-4 rounded-2xl border transition-all border-zinc-700 bg-zinc-900/80"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-2xl">{a.icon}</div>
                      <div className="text-[11px] px-2 py-0.5 rounded-full border border-lime-300/40 text-lime-300 bg-lime-300/10">
                        Lv.{a.level}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-zinc-100">{a.title}</div>
                    <div className="text-xs mt-0.5 leading-relaxed text-zinc-300">{a.desc}</div>
                    <div className="mt-2 text-lg font-black text-lime-300">
                      {a.value}
                      <span className="text-xs font-semibold text-lime-200 ml-1">{a.unit}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-zinc-400">
                      下一等级目标：{a.nextTarget}{a.unit}
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${a.progress * 100}%`, background: "linear-gradient(90deg, #d9ff63, #c9ff2f)" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
