import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight, Dumbbell, Play
} from "lucide-react";
import type { WorkoutRecord } from "../App";

const QUOTES = [
  { text: "Just Do It.", icon: "✔️" },
  { text: "Impossible is Nothing. —— Adidas", icon: "⚡" },
  { text: "I can accept failure, everyone fails at something. But I can’t accept not trying. —— Michael Jordan", icon: "🏀" },
  { text: "Hard work beats talent when talent doesn’t work hard. —— Kevin Durant", icon: "🔥" },
  { text: "It’s not about perfect. It’s about effort.", icon: "💪" },
  { text: "Success isn’t owned, it’s leased. And rent is due every day. —— J.J. Watt", icon: "📈" },
];

const HERO_IMAGE_KEY = "fitlog-home-hero-image";
const REMINDER_KEY = "fitlog-reminder-settings";
const GOALS_KEY = "fitlog-goal-settings";
const QUOTE_INDEX_KEY = "fitlog-home-quote-index";
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
  workouts: WorkoutRecord[];
  currentUser: string;
  users: string[];
  onSwitchUser: (user: string) => void;
  onCreateUser: (name: string) => void;
  onDeleteCurrentUser: () => void;
}

export function HomePage({
  onStartWorkout,
  workouts,
  currentUser,
  users,
  onSwitchUser,
  onCreateUser,
  onDeleteCurrentUser,
}: HomePageProps) {
  const [quoteIdx, setQuoteIdx] = useState(() => {
    const prev = Number(localStorage.getItem(QUOTE_INDEX_KEY));
    if (!Number.isFinite(prev) || prev < 0 || prev >= QUOTES.length) {
      return Math.floor(Math.random() * QUOTES.length);
    }
    if (QUOTES.length <= 1) return prev;
    let next = prev;
    while (next === prev) next = Math.floor(Math.random() * QUOTES.length);
    return next;
  });
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("19:30");
  const [goals, setGoals] = useState({
    weeklySessions: 4,
    cardioMinutes: 120,
    strengthVolume: 12000,
  });

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("zh-CN");
  const todayWorkouts = workouts.filter(w => new Date(w.date).toLocaleDateString("zh-CN") === today);
  const todayDone = todayWorkouts.length > 0;
  const todaySets = todayWorkouts.reduce((s, w) => s + w.sets.length, 0);

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
  const weekDays = new Set(weekWorkouts.map(w => new Date(w.date).toLocaleDateString("zh-CN"))).size;
  const weekSessions = weekWorkouts.length;
  const weekCardioMinutes = weekWorkouts
    .filter(w => w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.duration ?? set.weight ?? 0), 0), 0);
  const weekStrengthVolume = weekWorkouts
    .filter(w => !w.muscle.includes("有氧"))
    .reduce((sum, w) => sum + w.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);

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
    localStorage.setItem(QUOTE_INDEX_KEY, String(quoteIdx));
  }, [quoteIdx]);

  useEffect(() => {
    const saved = localStorage.getItem(HERO_IMAGE_KEY);
    if (saved) setHeroImage(saved);
  }, []);
  useEffect(() => {
    const savedReminder = localStorage.getItem(REMINDER_KEY);
    if (savedReminder) {
      try {
        const parsed = JSON.parse(savedReminder);
        setReminderEnabled(Boolean(parsed.enabled));
        setReminderTime(parsed.time ?? "19:30");
      } catch {
        // ignore parse failure
      }
    }
    const savedGoals = localStorage.getItem(GOALS_KEY);
    if (savedGoals) {
      try {
        setGoals(prev => ({ ...prev, ...JSON.parse(savedGoals) }));
      } catch {
        // ignore parse failure
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(REMINDER_KEY, JSON.stringify({ enabled: reminderEnabled, time: reminderTime }));
  }, [reminderEnabled, reminderTime]);
  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);
  useEffect(() => {
    if (!reminderEnabled) return;
    const timer = setInterval(() => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const dayTag = now.toLocaleDateString("zh-CN");
      const lastTag = localStorage.getItem("fitlog-reminder-last-day");
      if (hm === reminderTime && lastTag !== dayTag) {
        alert("Fitlog 提醒：该训练啦，今天也要完成打卡！");
        localStorage.setItem("fitlog-reminder-last-day", dayTag);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [reminderEnabled, reminderTime]);

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
  const getGoalPercent = (current: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };
  const goalProgress = [
    { label: "本周训练次数", current: weekSessions, target: goals.weeklySessions, unit: "次", color: "#2563eb" },
    { label: "本周有氧时长", current: Math.round(weekCardioMinutes), target: goals.cardioMinutes, unit: "min", color: "#0891b2" },
    { label: "本周力量总量", current: Math.round(weekStrengthVolume), target: goals.strengthVolume, unit: "kg", color: "#7c3aed" },
  ];
  const normalizeMuscle = (muscle: string) => (muscle.includes("有氧") ? "有氧" : muscle);

  // Week ring visualization
  const weekDays7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const ds = d.toLocaleDateString("zh-CN");
    const has = workouts.some(w => new Date(w.date).toLocaleDateString("zh-CN") === ds);
    const isToday = ds === today;
    return { has, isToday, label: "日一二三四五六"[d.getDay()] };
  });

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at top, #1a1a24 0%, #0b0b0f 55%, #08080b 100%)" }}>
      {/* Hero gradient section */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(145deg, #12121a 0%, #0d0d14 65%, #09090e 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #c9ff2f 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -left-12 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #7cf4d6 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 right-12 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />

        <div className="relative max-w-lg mx-auto px-5 pt-14 pb-10">
          {/* Top bar */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-zinc-400 text-sm">{dateStr}</p>
              <h2 className="text-white mt-1 flex items-center gap-2">
                <span className="text-xl">{greeting.emoji}</span>
                <span className="font-bold text-lg">{greeting.text}</span>
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5">{greeting.sub}</p>
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
            <p className="text-zinc-400 text-sm mt-1.5">简洁、力量感和速度感并存的健身记录体验</p>
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

          <div className="mb-5 rounded-2xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-sm">当前用户：{currentUser}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const name = prompt("请输入新用户名");
                    if (name) onCreateUser(name);
                  }}
                  className="h-8 px-2.5 rounded-lg bg-white/20 text-white text-xs border border-white/25"
                >
                  新建用户
                </button>
                <button
                  onClick={() => {
                    if (users.length <= 1) return;
                    if (confirm("删除当前用户及其所有训练记录？")) onDeleteCurrentUser();
                  }}
                  className="h-8 px-2.5 rounded-lg bg-red-500/30 text-white text-xs border border-red-200/30"
                >
                  删除用户
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {users.map(user => (
                <button
                  key={user}
                  onClick={() => onSwitchUser(user)}
                  className={`h-8 rounded-lg text-xs font-semibold border ${
                    user === currentUser
                      ? "text-black border-lime-200"
                      : "bg-white/15 text-zinc-300 border-white/20 hover:bg-white/25"
                  }`}
                  style={user === currentUser ? { background: "#c9ff2f" } : {}}
                >
                  {user}
                </button>
              ))}
            </div>
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
                <p className="text-zinc-300 text-xs mt-0.5">
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
                      : "bg-white/10 text-zinc-300"
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
              { value: streak, label: "连续天", icon: "🔥", color: "bg-black/25" },
              { value: weekDays, label: "本周天", icon: "📅", color: "bg-black/25" },
              { value: workouts.length, label: "总记录", icon: "⚡", color: "bg-black/25" },
            ].map(s => (
              <div key={s.label}
                className={`${s.color} rounded-2xl py-3 px-2 text-center border border-white/20 backdrop-blur-sm`}
              >
                <div className="text-xl mb-0.5">{s.icon}</div>
                <div className="text-lime-300 font-black text-2xl">{s.value}</div>
                <div className="text-zinc-300 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Rounded top clipping */}
      <div className="relative -mt-3 z-10 rounded-t-[28px] overflow-hidden"
        style={{ background: "linear-gradient(160deg, #13131b 0%, #0d0d13 60%, #09090d 100%)" }}
      >
        <div className="max-w-lg mx-auto px-5 pt-7 pb-28">

          {/* START WORKOUT Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartWorkout}
            className="w-full py-5 rounded-3xl flex items-center justify-center gap-3 mb-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #d9ff63 0%, #c9ff2f 60%, #b7ef1f 100%)",
              boxShadow: "0 12px 40px rgba(201,255,47,0.35), 0 4px 16px rgba(201,255,47,0.2)"
            }}
          >
            {/* Animated shine */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)" }}
              animate={{ x: ["-120%", "220%"] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear", repeatDelay: 2 }}
            />
            <div className="relative w-11 h-11 rounded-2xl bg-black/15 flex items-center justify-center">
              <Play className="w-5 h-5 text-black ml-0.5" />
            </div>
            <div className="relative text-left">
              <div className="text-black font-black text-xl">开始训练</div>
              <div className="text-black/70 text-xs">点击即可开始记录</div>
            </div>
            <ChevronRight className="relative w-5 h-5 text-black/70 ml-auto" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 mb-6"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-slate-800 text-sm">训练提醒</h3>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 accent-lime-400"
                />
                <span className="text-xs text-slate-600">{reminderEnabled ? "已开启" : "已关闭"}</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="h-9 px-2 rounded-lg border border-slate-200 text-sm text-slate-700"
              />
              <p className="text-xs text-slate-500">到点会弹出训练提醒。</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 mb-6"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <h3 className="font-bold text-slate-800 text-sm mb-2.5">个人目标追踪</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input
                type="number"
                min={1}
                value={goals.weeklySessions}
                onChange={(e) => setGoals(prev => ({ ...prev, weeklySessions: Math.max(1, Number(e.target.value) || 1) }))}
                className="h-9 px-2 rounded-lg border border-slate-200 text-xs"
                title="每周训练次数目标"
              />
              <input
                type="number"
                min={10}
                value={goals.cardioMinutes}
                onChange={(e) => setGoals(prev => ({ ...prev, cardioMinutes: Math.max(10, Number(e.target.value) || 10) }))}
                className="h-9 px-2 rounded-lg border border-slate-200 text-xs"
                title="每周有氧分钟目标"
              />
              <input
                type="number"
                min={100}
                value={goals.strengthVolume}
                onChange={(e) => setGoals(prev => ({ ...prev, strengthVolume: Math.max(100, Number(e.target.value) || 100) }))}
                className="h-9 px-2 rounded-lg border border-slate-200 text-xs"
                title="每周力量总量目标"
              />
            </div>
            <div className="space-y-2.5">
              {goalProgress.map(item => {
                const pct = getGoalPercent(item.current, item.target);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold" style={{ color: item.color }}>
                        {item.current}/{item.target} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Motivational Quote */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="mb-7 p-5 rounded-2xl border border-indigo-100 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #141420, #10101a)", boxShadow: "0 2px 16px rgba(124,58,237,0.22)" }}
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
                <span className="text-xs text-slate-400">在底部导航查看更多</span>
              </div>
              <div className="space-y-2.5">
                {[...workouts].reverse().slice(0, 4).map((workout, i) => {
                  const baseMuscle = normalizeMuscle(workout.muscle);
                  const mc = MUSCLE_COLORS[baseMuscle];
                  const best = Math.max(
                    ...workout.sets.map((s) => workout.muscle.includes("有氧") ? (s.duration ?? s.weight ?? 0) : (s.weight ?? 0))
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
                        {MUSCLE_EMOJI[baseMuscle] ?? "💪"}
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
                          {workout.muscle.includes("有氧") ? `${best}min` : `${best}kg`} · {workout.sets.length}组
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
