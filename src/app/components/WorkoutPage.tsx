import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Plus, Check, Trash2, RotateCcw,
  Timer, ChevronRight, X, Dumbbell, Wind, Trophy
} from "lucide-react";
import confetti from "canvas-confetti";
import type { WorkoutSet, WorkoutRecord } from "../App";
import { BOTTOM_SPACING } from "../layoutSpacing";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ExerciseData { name: string; icon: string; tip: string; }

interface WorkoutBlock {
  id: string;
  muscle: string;
  exercise: ExerciseData;
  sets: WorkoutSet[];
  isCardio: boolean;
}

interface MuscleGroup {
  name: string; icon: string;
  color: string; light: string; border: string; text: string;
  isCardio?: boolean;
  exercises: ExerciseData[];
}

// ─── Data ──────────────────────────────────────────────────────────────────

const muscleGroups: MuscleGroup[] = [
  {
    name: "胸", icon: "💪",
    color: "#ef4444", light: "#1b1517", border: "#5a2a33", text: "#fb7185",
    exercises: [
      { name: "平板卧推", icon: "🏋️", tip: "肩胛骨夹紧下沉，保持稳定" },
      { name: "上斜卧推", icon: "📐", tip: "上胸重点发力，控制下放" },
      { name: "下斜卧推", icon: "⬇️", tip: "下胸重点，保持核心收紧" },
      { name: "哑铃飞鸟", icon: "🦅", tip: "感受胸肌充分拉伸与收缩" },
      { name: "哑铃卧推", icon: "💪", tip: "活动范围更大，动作更自由" },
      { name: "绳索夹胸", icon: "🔀", tip: "全程保持张力，顶峰收缩" },
      { name: "俯卧撑",   icon: "⬆️", tip: "核心收紧，肘部微收内夹" },
      { name: "双杠撑体", icon: "🤸", tip: "身体前倾15度练下胸" },
    ]
  },
  {
    name: "背", icon: "🎯",
    color: "#2563eb", light: "#131a24", border: "#24456c", text: "#60a5fa",
    exercises: [
      { name: "引体向上", icon: "⬆️", tip: "肩胛骨下沉带动，全程控制" },
      { name: "杠铃划船", icon: "🚣", tip: "背部收紧，肘向后上方拉" },
      { name: "哑铃划船", icon: "🚣", tip: "单臂，更大活动范围" },
      { name: "硬拉",     icon: "⚡", tip: "脊柱保持中立，髋关节铰链" },
      { name: "高位下拉", icon: "⬇️", tip: "肘部向下后方拉，感受背阔" },
      { name: "坐姿划船", icon: "🏋️", tip: "全程控制速度，不要借力" },
      { name: "直臂下压", icon: "⬇️", tip: "双臂伸直感受背阔肌收缩" },
      { name: "T形杠划船",icon: "📐", tip: "厚背专项，中背重点" },
    ]
  },
  {
    name: "肩", icon: "🔺",
    color: "#d97706", light: "#1d1a12", border: "#6b4a1f", text: "#fbbf24",
    exercises: [
      { name: "哑铃推举", icon: "⬆️", tip: "全程控制节奏，不要弓背" },
      { name: "杠铃推举", icon: "🏋️", tip: "核心保持稳定，腿不借力" },
      { name: "侧平举",   icon: "↔️", tip: "肘部微弯，小指朝上拇指朝下" },
      { name: "前平举",   icon: "⬆️", tip: "避免身体前后摆动借力" },
      { name: "俯身飞鸟", icon: "🦅", tip: "后束肩重点训练" },
      { name: "阿诺德推举",icon:"🔄",tip: "全面刺激三束肩" },
      { name: "耸肩",     icon: "🔝", tip: "顶峰收缩停顿1秒" },
      { name: "面拉",     icon: "😤", tip: "手肘高于手腕，后束与外旋" },
    ]
  },
  {
    name: "腿", icon: "🦵",
    color: "#059669", light: "#121d18", border: "#1f5d45", text: "#34d399",
    exercises: [
      { name: "深蹲",     icon: "⬇️", tip: "膝盖跟随脚尖方向，背部挺直" },
      { name: "前蹲",     icon: "📐", tip: "上身更直立，股四头更刺激" },
      { name: "腿举",     icon: "🦵", tip: "脚掌位置决定发力重心" },
      { name: "腿弯举",   icon: "🔄", tip: "腘绳肌重点训练" },
      { name: "腿伸展",   icon: "📏", tip: "股四头孤立训练，顶峰停顿" },
      { name: "臀推",     icon: "🍑", tip: "臀肌顶峰收缩停顿" },
      { name: "罗马尼亚硬拉",icon:"⚡",tip: "背部挺直，感受腘绳拉伸" },
      { name: "弓步蹲",   icon: "🚶", tip: "前腿支撑，上身保持直立" },
      { name: "小腿提踵", icon: "👟", tip: "顶峰收缩停顿1秒，全程控制" },
    ]
  },
  {
    name: "手臂", icon: "💪",
    color: "#7c3aed", light: "#1a1324", border: "#4c2d7a", text: "#c084fc",
    exercises: [
      { name: "杠铃弯举", icon: "💪", tip: "避免身体前后摆动借力" },
      { name: "哑铃弯举", icon: "🔨", tip: "旋转前臂充分收缩二头" },
      { name: "锤式弯举", icon: "🔨", tip: "肱肌和前臂重点" },
      { name: "绳索弯举", icon: "🔀", tip: "全程保持恒定张力" },
      { name: "三头臂屈伸",icon:"🔽",tip: "肘部固定不移动" },
      { name: "颈后臂屈伸",icon:"⬆️",tip: "三头长头重点" },
      { name: "绳索下压", icon: "⬇️", tip: "肘部紧夹躯干不移动" },
      { name: "过顶三头",  icon: "🏋️", tip: "充分拉伸长头" },
    ]
  },
  {
    name: "有氧-户外", icon: "🌤️",
    color: "#0891b2", light: "#102024", border: "#0f5a67", text: "#67e8f9",
    isCardio: true,
    exercises: [
      { name: "跑步", icon: "🏃", tip: "保持稳定配速，腹式呼吸" },
      { name: "骑行", icon: "🚴", tip: "保持节奏，调节合适阻力" },
      { name: "快走", icon: "🚶", tip: "低强度持续输出，适合恢复日" },
      { name: "爬坡走", icon: "⛰️", tip: "增强心肺和下肢耐力" },
      { name: "跳绳", icon: "⭕", tip: "高效燃脂，手腕带动" },
      { name: "游泳", icon: "🏊", tip: "全身有氧，效果最佳" },
    ]
  },
  {
    name: "有氧-户内", icon: "🏠",
    color: "#0ea5a5", light: "#102020", border: "#0f6660", text: "#5eead4",
    isCardio: true,
    exercises: [
      { name: "椭圆机", icon: "🔄", tip: "低冲击有氧，膝盖友好" },
      { name: "划船机", icon: "🚣", tip: "全身60%肌肉参与" },
      { name: "爬楼梯机", icon: "🪜", tip: "臀腿有氧双重刺激" },
      { name: "动感单车", icon: "🚴", tip: "高效提升心肺，节奏感强" },
      { name: "HIIT", icon: "⚡", tip: "高强度间歇，燃脂效率最高" },
    ]
  },
];

const REPS_CHIPS = [5, 6, 8, 10, 12, 15, 20];
const INTENSITY_OPTIONS = [
  { key: "easy" as const, label: "轻松 🟢", active: "bg-lime-300 text-black border-lime-200", inactive: "bg-zinc-900 text-zinc-300 border-zinc-700" },
  { key: "medium" as const, label: "中等 🟡", active: "bg-lime-300 text-black border-lime-200", inactive: "bg-zinc-900 text-zinc-300 border-zinc-700" },
  { key: "hard" as const, label: "高强 🔴", active: "bg-lime-300 text-black border-lime-200", inactive: "bg-zinc-900 text-zinc-300 border-zinc-700" },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface WorkoutPageProps {
  onBack: () => void;
  onSaveWorkouts: (records: WorkoutRecord[]) => void;
  getPersonalRecord: (muscle: string, exercise: string) => number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WorkoutPage({ onBack, onSaveWorkouts, getPersonalRecord }: WorkoutPageProps) {
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMuscle, setPickerMuscle] = useState<string | null>(null);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(10);
  const [intensity, setIntensity] = useState<"easy" | "medium" | "hard">("medium");
  const [prFlash, setPrFlash] = useState<{ name: string; value: number; isCardio: boolean } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recordFlash, setRecordFlash] = useState<{ text: string; tone: string } | null>(null);
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseTip, setCustomExerciseTip] = useState("");
  const [customExerciseCardio, setCustomExerciseCardio] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 60000)), 15000);
    return () => clearInterval(t);
  }, []);

  const activeBlock = blocks.find(b => b.id === activeBlockId) ?? null;
  const pickerMuscleData = muscleGroups.find(m => m.name === pickerMuscle);
  const totalSets = blocks.reduce((s, b) => s + b.sets.length, 0);
  const canFinish = blocks.some(b => b.sets.length > 0);

  const handleSelectExercise = (exercise: ExerciseData, isCardio: boolean) => {
    const id = `block-${Date.now()}`;
    setBlocks(prev => [...prev, { id, muscle: pickerMuscle!, exercise, sets: [], isCardio }]);
    setActiveBlockId(id);
    setWeight(0);
    setReps(isCardio ? 6 : 10);
    setIntensity("medium");
    setShowPicker(false);
    setPickerMuscle(null);
  };
  const handleCustomExercise = (isCardio: boolean) => {
    setCustomExerciseCardio(isCardio);
    setCustomExerciseName("");
    setCustomExerciseTip("");
    setShowCustomExerciseModal(true);
  };
  const submitCustomExercise = () => {
    const name = customExerciseName.trim();
    if (!name) return;
    const tip = customExerciseTip.trim() || "自定义动作，请注意动作标准与安全。";
    handleSelectExercise(
      { name, icon: customExerciseCardio ? "📝" : "✍️", tip },
      customExerciseCardio
    );
    setShowCustomExerciseModal(false);
  };

  const triggerPR = (exerciseName: string, value: number, isCardio: boolean) => {
    setPrFlash({ name: exerciseName, value, isCardio });
    setTimeout(() => setPrFlash(null), 1600);
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ["#2563eb", "#7c3aed", "#fbbf24", "#34d399"] });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors: ["#2563eb", "#60a5fa"] }), 300);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors: ["#7c3aed", "#c4b5fd"] }), 500);
  };

  const addSet = () => {
    if (!activeBlockId || !activeBlock) return;
    if (activeBlock.isCardio && weight <= 0) {
      alert("请先设置有氧时长（分钟）");
      return;
    }
    if (!activeBlock.isCardio && (weight <= 0 || reps <= 0)) {
      alert("请先设置有效的重量和次数");
      return;
    }
    const newSet: WorkoutSet = activeBlock.isCardio
      ? { duration: weight, intensity }
      : { weight, reps };
    setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, sets: [...b.sets, newSet] } : b));
    setRecordFlash({
      text: activeBlock.isCardio
        ? `+1 组 ${weight} 分钟已记录`
        : `+1 组 ${weight}kg × ${reps}次`,
      tone: activeBlock.isCardio ? "#0891b2" : (muscleGroups.find(m => m.name === activeBlock.muscle)?.color ?? "#2563eb"),
    });
    setTimeout(() => setRecordFlash(null), 1200);
    const pr = getPersonalRecord(activeBlock.muscle, activeBlock.exercise.name);
    if (weight > pr) triggerPR(activeBlock.exercise.name, weight, activeBlock.isCardio);
  };

  const undoLastSet = (blockId: string) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, sets: b.sets.slice(0, -1) } : b));
  };

  const removeSet = (blockId: string, idx: number) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, sets: b.sets.filter((_, i) => i !== idx) } : b));
  };

  const removeBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (activeBlockId === blockId) setActiveBlockId(null);
  };

  const finishWorkout = () => {
    const records: WorkoutRecord[] = blocks
      .filter(b => b.sets.length > 0)
      .map((b, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString(),
        muscle: b.muscle,
        exercise: b.exercise.name,
        sets: b.sets,
      }));
    if (records.length > 0) onSaveWorkouts(records);
    onBack();
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at top, #1a1a24 0%, #0b0b0f 55%, #08080b 100%)" }}>

      {/* PR Flash Overlay */}
      <AnimatePresence>
        {prFlash && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
            style={{ backdropFilter: "blur(2px)", background: "rgba(15,23,42,0.2)" }}
          >
            <motion.div
              initial={{ scale: 0.2, y: 60, opacity: 0, rotate: -8 }}
              animate={{ scale: [1, 1.08, 1], y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.05, y: -30, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative px-10 py-8 rounded-3xl text-center overflow-hidden border-2 border-white/80"
              style={{
                background: "linear-gradient(135deg, #12121a 0%, #0c0c12 100%)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 8px rgba(201,255,47,0.16)"
              }}
            >
              <motion.div animate={{ scale: [1, 1.35, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.7, delay: 0.05 }}>
                <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-3" />
              </motion.div>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.7 }}
                className="text-white text-4xl font-black tracking-tight"
              >
                NEW PR
              </motion.p>
              <p className="text-lime-300 mt-1.5 font-semibold">
                {prFlash.name} · {prFlash.value}{prFlash.isCardio ? "min" : "kg"}
              </p>
              <p className="text-zinc-300 text-sm mt-1">个人最佳成绩已刷新</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-indigo-100/80"
        style={{ background: "rgba(14,14,20,0.86)", backdropFilter: "blur(16px)", borderColor: "#2a2a33" }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </motion.button>
            <div>
              <h1 className="font-black text-slate-800 text-base">训练中</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Timer className="w-3 h-3" />
                {elapsed < 1 ? "刚刚开始" : `已 ${elapsed} 分钟`}
                {totalSets > 0 && (
                  <motion.span
                    key={totalSets}
                    initial={{ scale: 0.8, y: 3, opacity: 0.4 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="text-lime-300 font-semibold"
                  >
                    · {totalSets} 组
                  </motion.span>
                )}
              </p>
            </div>
          </div>

          {canFinish && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={finishWorkout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black shadow-lg"
              style={{ background: "linear-gradient(135deg, #d9ff63, #c9ff2f)", boxShadow: "0 4px 16px rgba(201,255,47,0.35)" }}
            >
              <Check className="w-4 h-4" /> 完成训练
            </motion.button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {recordFlash && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-lg"
            style={{ background: recordFlash.tone }}
          >
            {recordFlash.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        className="max-w-lg mx-auto px-4 py-5"
        style={{ paddingBottom: BOTTOM_SPACING.pageContent }}
      >
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {blocks.map(block => {
              const isActive = block.id === activeBlockId;
              const mg = muscleGroups.find(m => m.name === block.muscle);

              return (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, scale: 0.9 }}
                  className="rounded-2xl bg-white overflow-hidden"
                  style={{
                    boxShadow: isActive
                      ? `0 8px 32px ${mg?.color ?? "#6366f1"}22, 0 0 0 2px ${mg?.color ?? "#6366f1"}`
                      : "0 2px 12px rgba(0,0,0,0.06)",
                    border: isActive ? "none" : "1px solid #e2e8f0"
                  }}
                >
                  {/* Colored top bar */}
                  <div className="h-1.5 w-full" style={{ background: mg?.color ?? "#6366f1" }} />

                  {/* Block header */}
                  <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setActiveBlockId(isActive ? null : block.id)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${mg?.color ?? "#6366f1"}15` }}>
                      {block.exercise.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{block.exercise.name}</span>
                        {block.isCardio && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: `${mg?.color}20`, color: mg?.color }}>
                            有氧
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: mg?.color ?? "#6366f1" }}>
                        {block.muscle}
                        {block.sets.length > 0 && <span className="text-slate-400 font-normal"> · {block.sets.length} 组已记录</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }}
                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <motion.div animate={{ rotate: isActive ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Collapsed set pills */}
                  {!isActive && block.sets.length > 0 && (
                    <div className="px-4 pb-3.5 flex flex-wrap gap-1.5">
                      {block.sets.map((set, i) => (
                        <span key={i}
                          className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                          style={{ background: `${mg?.color}10`, color: mg?.color, borderColor: `${mg?.color}30` }}
                        >
                          {block.isCardio
                            ? `${set.duration ?? set.weight ?? 0}min`
                            : `${set.weight ?? 0}×${set.reps ?? 0}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Active panel */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 pt-1 border-t border-slate-100">
                          {/* Tip */}
                          <div className="flex items-center gap-2 mb-5 p-3 rounded-xl"
                            style={{ background: `${mg?.color}08` }}>
                            <span className="text-base">💡</span>
                            <p className="text-xs text-slate-600">{block.exercise.tip}</p>
                          </div>

                          {/* Weight / Duration slider */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {block.isCardio ? "⏱ 时长（分钟）" : "🏋️ 重量（kg）"}
                              </span>
                              <span className="font-black text-base" style={{ color: mg?.color ?? "#6366f1" }}>
                                {weight}{block.isCardio ? " min" : " kg"}
                              </span>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <input
                                type="range"
                                min={0}
                                max={block.isCardio ? 180 : 300}
                                step={block.isCardio ? 1 : 2.5}
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                              />
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-xs text-slate-400">默认从 0 开始，可滑动调节</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={weight}
                                  step={block.isCardio ? 1 : 0.5}
                                  onChange={(e) => setWeight(Math.max(0, Number(e.target.value) || 0))}
                                  className="w-24 h-8 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
                                />
                              </div>
                            </div>
                          </div>

                          {!block.isCardio && (
                            <div className="mb-5">
                              <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🔁 次数</span>
                                <span className="font-black text-base" style={{ color: mg?.color ?? "#6366f1" }}>
                                  {reps} 次
                                </span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {REPS_CHIPS.map(chip => (
                                  <button key={chip} onClick={() => setReps(chip)}
                                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 ${
                                      reps === chip ? "text-black border-lime-200 shadow-md scale-105" : "text-slate-600 border-slate-200 bg-white hover:border-lime-300 hover:bg-lime-100/20"
                                    }`}
                                    style={reps === chip ? { background: "#c9ff2f", boxShadow: "0 4px 14px rgba(201,255,47,0.35)" } : {}}
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>
                              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-slate-400">可自定义输入次数</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={reps}
                                    step={1}
                                    onChange={(e) => setReps(Math.max(1, Number(e.target.value) || 1))}
                                    className="w-24 h-8 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Cardio intensity */}
                          {block.isCardio && (
                            <div className="mb-5">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">💪 强度</span>
                              <div className="flex gap-2">
                                {INTENSITY_OPTIONS.map(opt => (
                                  <button key={opt.key} onClick={() => setIntensity(opt.key)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                      intensity === opt.key ? opt.active : opt.inactive
                                    }`}
                                  >{opt.label}</button>
                                ))}
                              </div>
                              <p className="text-xs text-slate-400 mt-2">有氧按时长记录，统计单位为分钟。</p>
                            </div>
                          )}

                          {/* 打卡 button */}
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.96 }}
                            onClick={addSet}
                            className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 relative overflow-hidden"
                            style={{
                              background: "linear-gradient(135deg, #d9ff63, #c9ff2f)",
                              boxShadow: "0 8px 28px rgba(201,255,47,0.35)"
                            }}
                          >
                            <motion.div
                              className="absolute inset-0"
                              style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)" }}
                              animate={{ x: ["-120%", "220%"] }}
                              transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1.5 }}
                            />
                            <span className="relative text-black">🎯</span>
                            <span className="relative text-black">打卡记录一组</span>
                            {block.sets.length > 0 && (
                              <span className="relative ml-1 text-sm text-black/70">第{block.sets.length + 1}组</span>
                            )}
                          </motion.button>

                          {/* Set history */}
                          <AnimatePresence>
                            {block.sets.length > 0 && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400">已记录 {block.sets.length} 组</span>
                                  <button onClick={() => undoLastSet(block.id)}
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors font-semibold">
                                    <RotateCcw className="w-3 h-3" /> 撤回最后一组
                                  </button>
                                </div>
                                {block.sets.map((set, i) => (
                                  <motion.div key={i}
                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
                                        style={{ background: mg?.color ?? "#6366f1" }}>{i + 1}</div>
                                      <span className="text-sm font-bold text-slate-700">
                                        {block.isCardio
                                          ? `${set.duration ?? set.weight ?? 0}min`
                                          : `${set.weight ?? 0}kg × ${set.reps ?? 0}次`}
                                      </span>
                                      {set.intensity && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold border ${
                                          INTENSITY_OPTIONS.find(o => o.key === set.intensity)?.inactive
                                        }`}>
                                          {set.intensity === "easy" ? "轻" : set.intensity === "medium" ? "中" : "强"}
                                        </span>
                                      )}
                                    </div>
                                    <button onClick={() => removeSet(block.id, i)}
                                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center transition-all hover:bg-red-100">
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {blocks.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl"
              style={{ background: "linear-gradient(135deg, #1b1b28, #121220)", boxShadow: "0 8px 32px rgba(124,58,237,0.28)" }}>
              🏋️
            </div>
            <p className="font-bold text-slate-700 text-lg">准备开始训练</p>
            <p className="text-slate-400 text-sm mt-1">点击下方按钮，选择第一个动作</p>
          </motion.div>
        )}

        {/* Add exercise button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowPicker(true)}
          className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-lime-300 text-lime-300 hover:border-lime-200 hover:text-lime-200 hover:bg-lime-200/10 transition-all flex items-center justify-center gap-2 font-bold bg-white/60"
        >
          <Plus className="w-5 h-5" /> 添加训练内容
        </motion.button>
      </div>

      {/* ── Exercise Picker Bottom Sheet ── */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => { setShowPicker(false); setPickerMuscle(null); }} />

            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[80] rounded-t-[28px] overflow-hidden bg-white"
              style={{ maxHeight: "90vh", boxShadow: "0 -8px 60px rgba(0,0,0,0.18)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>

              <div
                className="overflow-y-auto"
                style={{
                  maxHeight: "calc(90vh - 24px)",
                  scrollbarWidth: "none",
                  paddingBottom: BOTTOM_SPACING.interactionPanel,
                }}
              >
                <AnimatePresence mode="wait">
                  {!pickerMuscle ? (
                    /* Muscle selection */
                    <motion.div key="muscle"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                      className="p-5 pb-20"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-black text-zinc-100">选择训练类型</h2>
                          <p className="text-sm text-zinc-300 mt-0.5">选择你要训练的部位或类型</p>
                        </div>
                        <button onClick={() => { setShowPicker(false); setPickerMuscle(null); }}
                          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                          <X className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      {/* Strength */}
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                        <Dumbbell className="w-3.5 h-3.5" /> 力量训练
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        {muscleGroups.filter(m => !m.isCardio).map((mg, i) => (
                          <motion.button key={mg.name}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setPickerMuscle(mg.name)}
                            className="p-4 rounded-2xl border text-left transition-all"
                            style={{ background: mg.light, borderColor: mg.border, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                          >
                            <div className="text-3xl mb-2">{mg.icon}</div>
                            <div className="font-bold text-zinc-100">{mg.name}</div>
                            <div className="text-xs mt-0.5 font-semibold" style={{ color: mg.text }}>{mg.exercises.length} 个动作</div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Cardio */}
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                        <Wind className="w-3.5 h-3.5" /> 有氧运动
                      </div>
                      {muscleGroups.filter(m => m.isCardio).map(mg => (
                        <motion.button key={mg.name}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setPickerMuscle(mg.name)}
                          className="w-full p-4 rounded-2xl border flex items-center gap-4 transition-all"
                          style={{ background: mg.light, borderColor: mg.border, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                        >
                          <span className="text-3xl">{mg.icon}</span>
                          <div className="text-left flex-1">
                            <div className="font-bold text-zinc-100">{mg.name}</div>
                            <div className="text-xs mt-0.5 font-semibold" style={{ color: mg.text }}>{mg.exercises.length} 种运动可选</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    /* Exercise selection */
                    <motion.div key="exercise"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="p-5 pb-20"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setPickerMuscle(null)}
                          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                          <ArrowLeft className="w-4 h-4 text-slate-500" />
                        </button>
                        <div>
                          <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2">
                            <span>{pickerMuscleData?.icon}</span>
                            <span>{pickerMuscle}</span>
                          </h2>
                          <p className="text-xs text-zinc-300">选择训练动作</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {pickerMuscleData?.exercises.map((ex, i) => {
                          const pr = getPersonalRecord(pickerMuscle!, ex.name);
                          const isCardio = pickerMuscleData.isCardio ?? false;
                          return (
                            <motion.button key={ex.name}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                              onClick={() => handleSelectExercise(ex, isCardio)}
                              className="w-full p-4 rounded-2xl border bg-white border-slate-100 hover:border-lime-300 hover:bg-lime-200/10 text-left flex items-center gap-4 transition-all group"
                              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                            >
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform"
                                style={{ background: `${pickerMuscleData.color}12` }}>
                                {ex.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-zinc-100">{ex.name}</div>
                                <div className="text-xs text-zinc-300 mt-0.5 truncate">{ex.tip}</div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {pr > 0 ? (
                                  <>
                                    <div className="text-xs text-slate-400">PR</div>
                                    <div className="text-sm font-black" style={{ color: pickerMuscleData.color }}>
                                      {isCardio ? `${pr}min` : `${pr}kg`}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-300">暂无</span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-lime-300 transition-colors flex-shrink-0" />
                            </motion.button>
                          );
                        })}
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleCustomExercise(pickerMuscleData?.isCardio ?? false)}
                          className="w-full p-4 rounded-2xl border-2 border-dashed border-lime-300 bg-lime-200/10 text-left flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl">➕</div>
                          <div>
                            <div className="font-bold text-lime-300">自定义动作</div>
                            <div className="text-xs text-zinc-300 mt-0.5">添加系统里没有的训练姿势</div>
                          </div>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomExerciseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCustomExerciseModal(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.98, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-zinc-100 font-black text-lg">自定义动作</h3>
              <p className="text-zinc-300 text-xs mt-1">添加一个{customExerciseCardio ? "有氧" : "力量"}动作，后续可直接选择</p>
              <div className="mt-3 space-y-2.5">
                <input
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  placeholder="动作名称（必填）"
                  autoFocus
                  className="w-full h-10 rounded-xl border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-400 outline-none"
                />
                <input
                  value={customExerciseTip}
                  onChange={(e) => setCustomExerciseTip(e.target.value)}
                  placeholder="动作提示（可选）"
                  className="w-full h-10 rounded-xl border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-400 outline-none"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowCustomExerciseModal(false)}
                  className="h-10 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={submitCustomExercise}
                  className="h-10 rounded-xl bg-lime-300 text-black text-sm font-black"
                >
                  添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
