import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart2, TrendingUp, Flame, Zap, Target,
  ChevronRight, Dumbbell, Play, Calendar, Award
} from "lucide-react";
import type { WorkoutRecord } from "../App";

const QUOTES = [
  { text: "每一滴汗水，都是对自己最好的投资。", icon: "💪" },
  { text: "不是因为看到希望才坚持，而是坚持了才看到希望。", icon: "🔥" },
  { text: "今天的痛苦，是明天更强大的基础。", icon: "⚡" },
  { text: "你的极限只存在于你停止突破的那一刻。", icon: "🏆" },
  { text: "不要比较，专注自己的进步，哪怕每次只有 1%。", icon: "📈" },
];

const HERO_IMAGE_KEY = "fitlog-home-hero-image";
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: "夜猫子打卡", sub: "深夜坚持，致敬！", emoji: "🌙" };
  if (h < 12) return { text: "早安运动员", sub: "晨练开启活力一天", emoji: "🌅" };
  if (h < 14) return { text: "午间能量", sub: "午休也要动起来！", emoji: "☀️" };
  if (h < 18) return { text: "下午加速", sub: "黄金训练时段到了", emoji: "⚡" };
  if (h < 22) return { text: "晚间训练", sub: "一天最后的燃烧机会", emoji: "🔥" };
  return { text: "深夜战士", sub: "不眠不休，热爱可抵岁月", emoji: "🌟" };
}

const MUSCLE_EMOJI: Record<string, string> = {
  "胸":"💪","背":"🎯","肩":"🔺","腿":"🦵","手臂":"💪","有氧":"🏃",
};

const MUSCLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "胸":   { bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200" },
  "背":   { bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200" },
  "肩":   { bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200" },
  "腿":   { bg: "bg-emerald-50", text: "text-emerald-600",border: "border-emerald-200" },
  "手臂": { bg: "bg-purple-50",  text: "text-purple-600", border: "border-purple-200" },
  "有氧": { bg: "bg-teal-50",    text: "text-teal-600",   border: "border-teal-200" },
};

interface HomePageProps {
  onStartWorkout: () => void;
  onViewHistory: () => void;
  onViewSummary: () => void;
  workouts: WorkoutRecord[];
}

export function HomePage({ onStartWorkout, onViewHistory, onViewSummary, workouts }: HomePageProps) {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("zh-CN");
  const todayWorkouts = workouts.filter(w => new Date(w.date).toLocaleDateString("zh-CN") === today);
  const todayDone = todayWorkouts.length > 0;
  const todaySets = todayWorkouts.reduce((s, w) => s + w.sets.length, 0);

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
  const weekDays = new Set(weekWorkouts.map(w => new Date(w.date).toLocaleDateString("zh-CN"))).size;

  const streak = (() => {
    let count = 0;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    while (true) {
      const has = workouts.some(w => { const wd = new Date(w.date); wd.setHours(0,0,0,0); return wd.getTime() === d.getTime(); });
      if (!has) break;
      count++; d.setTime(d.getTime() - 86400000);
    }
    return count;
  })();

  useEffect(() => {
    const iv = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => { setQuoteIdx(i => (i + 1) % QUOTES.length); setQuoteVisible(true); }, 300);
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(HERO_IMAGE_KEY);
    if (saved) setHeroImage(saved);
  }, []);

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long", day: "numeric", weekday: "long",
  });

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (!url) return;
      setHeroImage(url);
      localStorage.setItem(HERO_IMAGE_KEY, url);
    };
    reader.readAsDataURL(file);
  };

  // Week ring visualization
  const weekDays7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const ds = d.toLocaleDateString("zh-CN");
    const has = workouts.some(w => new Date(w.date).toLocaleDateString("zh-CN") === ds);
    const isToday = ds === today;
    return { has, isToday, label: "日一二三四五六"[d.getDay()] };
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #eff6ff 0%, #f0f4ff 50%, #faf5ff 100%)" }}>
      {/* Hero gradient section */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 60%, #7c3aed 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -left-12 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 right-12 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }} />

        <div className="relative max-w-lg mx-auto px-5 pt-14 pb-10">
          {/* Top bar */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-blue-200 text-sm">{dateStr}</p>
              <h2 className="text-white mt-1 flex items-center gap-2">
                <span className="text-xl">{greeting.emoji}</span>
                <span className="font-bold text-lg">{greeting.text}</span>
              </h2>
              <p className="text-blue-200 text-xs mt-0.5">{greeting.sub}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
              >
                <Dumbbell className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>

          {/* App name */}
          <div className="mb-6">
            <h1 className="text-5xl font-black text-white tracking-tight">FitLog</h1>
            <p className="text-blue-200 text-sm mt-1.5">像打游戏一样记录训练 · 见证进步</p>
          </div>

          <div className="mb-5 rounded-2xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm">
            <img
              src={heroImage}
              alt="运动封面"
              onClick={() => imageInputRef.current?.click()}
              className="w-full h-40 object-cover rounded-xl border border-white/20 cursor-pointer"
            />
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Today status card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-4 border mb-5"
            style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)" }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                todayDone ? "bg-emerald-400/30" : "bg-white/20"
              }`}>
                {todayDone ? "✅" : "🎯"}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base">
                  {todayDone ? `今日已完成 ${todaySets} 组` : "今天还没有训练"}
                </p>
                <p className="text-blue-100 text-xs mt-0.5">
                  {todayDone ? `本周 ${weekDays} 天 · 连续打卡 ${streak} 天 🔥` : "开始记录今日训练吧"}
                </p>
              </div>
            </div>

            {/* Week dots */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/15">
              {weekDays7.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    d.has
                      ? "bg-emerald-400 text-white shadow-md"
                      : d.isToday
                      ? "bg-white/30 text-white border-2 border-white/60"
                      : "bg-white/10 text-blue-200"
                  }`}>
                    {d.has ? "✓" : d.label}
                  </div>
                  <div className={`w-1 h-1 rounded-full ${d.isToday ? "bg-amber-400" : "bg-transparent"}`} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-2.5"
          >
            {[
              { value: streak, label: "连续天", icon: "🔥", color: "bg-orange-400/25" },
              { value: weekDays, label: "本周天", icon: "📅", color: "bg-sky-400/25" },
              { value: workouts.length, label: "总记录", icon: "⚡", color: "bg-violet-400/25" },
            ].map(s => (
              <div key={s.label}
                className={`${s.color} rounded-2xl py-3 px-2 text-center border border-white/20 backdrop-blur-sm`}
              >
                <div className="text-xl mb-0.5">{s.icon}</div>
                <div className="text-white font-black text-2xl">{s.value}</div>
                <div className="text-blue-100 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Rounded top clipping */}
      <div className="relative -mt-3 z-10 rounded-t-[28px] overflow-hidden"
        style={{ background: "linear-gradient(160deg, #eff6ff 0%, #f0f4ff 50%, #faf5ff 100%)" }}
      >
        <div className="max-w-lg mx-auto px-5 pt-7 pb-12">

          {/* START WORKOUT Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartWorkout}
            className="w-full py-5 rounded-3xl flex items-center justify-center gap-3 mb-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 60%, #7c3aed 100%)",
              boxShadow: "0 12px 48px rgba(79,70,229,0.45), 0 4px 16px rgba(37,99,235,0.3)"
            }}
          >
            {/* Animated shine */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)" }}
              animate={{ x: ["-120%", "220%"] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear", repeatDelay: 2 }}
            />
            <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
            <div className="relative text-left">
              <div className="text-white font-black text-xl">开始训练</div>
              <div className="text-blue-100 text-xs">点击即可开始记录</div>
            </div>
            <ChevronRight className="relative w-5 h-5 text-blue-200 ml-auto" />
          </motion.button>

          {/* Quick access buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-7"
          >
            {[
              { label: "训练历史", sub: "查看过去记录", icon: <BarChart2 className="w-5 h-5" />, onClick: onViewHistory, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
              { label: "周期总结", sub: "数据 & 成就", icon: <TrendingUp className="w-5 h-5" />, onClick: onViewSummary, color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
            ].map(btn => (
              <motion.button
                key={btn.label}
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={btn.onClick}
                className="p-4 rounded-2xl border text-left"
                style={{ background: btn.bg, borderColor: btn.border, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${btn.color}18`, color: btn.color }}>
                  {btn.icon}
                </div>
                <div className="font-bold text-slate-800">{btn.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{btn.sub}</div>
              </motion.button>
            ))}
          </motion.div>

          {/* Motivational Quote */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="mb-7 p-5 rounded-2xl border border-indigo-100 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #eff6ff, #f0f4ff)", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" }}
          >
            <div className="absolute -right-3 -top-3 text-8xl opacity-8 select-none">"</div>
            <AnimatePresence mode="wait">
              {quoteVisible && (
                <motion.div key={quoteIdx}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3 relative"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{QUOTES[quoteIdx].icon}</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{QUOTES[quoteIdx].text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Workouts */}
          {workouts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">最近训练</h3>
                <button onClick={onViewHistory} className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-800">
                  查看全部 <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2.5">
                {[...workouts].reverse().slice(0, 4).map((workout, i) => {
                  const mc = MUSCLE_COLORS[workout.muscle];
                  const best = Math.max(
                    ...workout.sets.map((s) => workout.muscle === "有氧" ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0))
                  );
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.42 + i * 0.06 }}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl border bg-white"
                      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", borderColor: "#e2e8f0" }}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${mc?.bg ?? "bg-slate-50"} ${mc?.border ?? "border-slate-200"}`}>
                        {MUSCLE_EMOJI[workout.muscle] ?? "💪"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{workout.exercise}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${mc?.text ?? "text-slate-500"}`}>{workout.muscle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">
                          {new Date(workout.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                        </p>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">
                          {workout.muscle === "有氧" ? `${best}min` : `${best}kg`} · {workout.sets.length}组
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
