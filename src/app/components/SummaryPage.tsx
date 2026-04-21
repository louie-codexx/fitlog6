import { motion } from "motion/react";
import { ArrowLeft, Award, Calendar, Flame, TrendingUp, Zap, Star, Target, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import type { WorkoutRecord } from "../App";

const PIE_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#ef4444", "#ea580c"];

const MUSCLE_EMOJI: Record<string, string> = {
  "胸":"💪","背":"🎯","肩":"🔺","腿":"🦵","手臂":"💪","有氧":"🏃",
};

interface StatCardProps {
  icon: React.ReactNode;
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
    const max = Math.max(...w.sets.map(s => w.muscle === "有氧" ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0)));
    const prev = arr.slice(0, idx).filter(p => p.muscle === w.muscle && p.exercise === w.exercise);
    if (!prev.length) return false;
    return max > Math.max(
      ...prev.flatMap(p => p.sets.map(s => p.muscle === "有氧" ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0)))
    );
  }).length;

  const totalVolume = monthWorkouts
    .filter(w => w.muscle !== "有氧")
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);

  const cardioMinutes = monthWorkouts
    .filter(w => w.muscle === "有氧")
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
  const strengthSessions = monthWorkouts.filter(w => w.muscle !== "有氧").length;
  const cardioSessions = monthWorkouts.filter(w => w.muscle === "有氧").length;
  const consistencyScore = Math.min(100, Math.round((new Set(monthWorkouts.map(w => new Date(w.date).toLocaleDateString("zh-CN"))).size / 30) * 100));

  // Weekly bar chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000);
    const ds = d.toLocaleDateString("zh-CN");
    const dayWs = workouts.filter(w => new Date(w.date).toLocaleDateString("zh-CN") === ds);
    return {
      name: `周${"日一二三四五六"[d.getDay()]}`,
      力量: dayWs.filter(w => w.muscle !== "有氧").length,
      有氧分钟: dayWs
        .filter(w => w.muscle === "有氧")
        .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0),
    };
  });

  const oneRMByExercise = monthWorkouts
    .filter(w => w.muscle !== "有氧")
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
    .filter(w => w.muscle !== "有氧")
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

  // Muscle distribution pie
  const muscleDist = monthWorkouts.reduce((acc, w) => {
    acc[w.muscle] = (acc[w.muscle] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(muscleDist).sort(([,a],[,b]) => b-a)
    .map(([name, value]) => ({ name: `${MUSCLE_EMOJI[name] ?? ""} ${name}`, value }));

  const suggestions = [
    consistencyScore < 40 ? "训练频率偏低，建议先稳定为每周 3 次打卡，再逐步加量。" : null,
    cardioMinutes < 90 ? "本月有氧时长偏少，建议补充到每周 90-150 分钟中等强度有氧。" : null,
    overloadRate < 20 ? "渐进超负荷不足，可以在主项每1-2周增加 2.5-5kg 或增加1-2次。" : null,
    Object.keys(muscleDist).length < 4 ? "训练部位覆盖偏少，建议加入弱项部位，提升整体均衡性。" : null,
  ].filter(Boolean) as string[];

  // Achievements
  const achievements = [
    { icon: "🌟", title: "破冰之旅", desc: "完成第一次训练", done: workouts.length >= 1 },
    { icon: "🔥", title: "连续3天", desc: "保持3天连续打卡", done: streak >= 3 },
    { icon: "⚡", title: "一周不断", desc: "连续训练整整7天", done: streak >= 7 },
    { icon: "🏆", title: "突破纪录", desc: "突破个人最高记录", done: prBreaks >= 1 },
    { icon: "💪", title: "力量吨级", desc: "本月总量超过1000kg", done: totalVolume >= 1000 },
    { icon: "🎯", title: "全面发展", desc: "涉及5个以上训练部位", done: Object.keys(muscleDist).length >= 5 },
    { icon: "🏃", title: "有氧达人", desc: "累计完成120分钟有氧", done: cardioMinutes >= 120 },
    { icon: "📅", title: "月度勇士", desc: "本月训练超过20次", done: monthWorkouts.length >= 20 },
  ];

  const unlockedCount = achievements.filter(a => a.done).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #eff6ff 0%, #f0f4ff 60%, #faf5ff 100%)" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-blue-100/80"
        style={{ background: "rgba(239,246,255,0.9)", backdropFilter: "blur(16px)" }}>
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

      <div className="max-w-lg mx-auto px-4 py-5 pb-12">
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
              className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: "一致性", val: consistencyScore, unit: "%", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                { label: "超负荷率", val: overloadRate, unit: "%", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
                { label: "节奏评分", val: rhythmScore, unit: "分", color: "#0f766e", bg: "#ecfeff", border: "#99f6e4" },
              ].map(s => (
                <div key={s.label}
                  className="rounded-2xl p-3.5 text-center border"
                  style={{ background: s.bg, borderColor: s.border, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="font-black text-xl" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.unit} · {s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Weekly bar chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 mb-4"
              style={{ boxShadow: "0 4px 24px rgba(79,70,229,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">本周训练频率</h2>
                  <p className="text-xs text-slate-400">过去7天数据</p>
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
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">力量能力画像</h2>
                    <p className="text-xs text-slate-400">动作估算1RM（Epley）Top {oneRMData.length}</p>
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
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">本月部位分布</h2>
                    <p className="text-xs text-slate-400">各部位训练占比</p>
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
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-800 text-sm">训练建议</h2>
                <span className="text-xs text-slate-400">科学性提示</span>
              </div>
              <div className="space-y-2">
                {suggestions.length > 0 ? suggestions.map((s, i) => (
                  <motion.div key={s}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.34 + i * 0.05 }}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    {s}
                  </motion.div>
                )) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    训练结构较均衡，建议继续保持当前节奏并每月复盘一次动作质量。
                  </div>
                )}
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
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">成就系统</h2>
                    <p className="text-xs text-slate-400">{unlockedCount}/{achievements.length} 已解锁</p>
                  </div>
                </div>
                <span className="text-sm font-black text-indigo-600">{Math.round(unlockedCount / achievements.length * 100)}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full mb-5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #2563eb, #7c3aed)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {achievements.map((a, i) => (
                  <motion.div key={a.title}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.38 + i * 0.05 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      a.done
                        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className={`text-2xl mb-1.5 ${!a.done ? "grayscale opacity-40" : ""}`}>{a.icon}</div>
                    <div className={`font-bold text-sm ${a.done ? "text-slate-800" : "text-slate-400"}`}>{a.title}</div>
                    <div className={`text-xs mt-0.5 leading-relaxed ${a.done ? "text-slate-500" : "text-slate-300"}`}>{a.desc}</div>
                    {a.done && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-semibold">
                        <Star className="w-3 h-3" /> 已解锁
                      </div>
                    )}
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
