import type { WorkoutSet } from "./App";

export const DEFAULT_BODY_WEIGHT_KG = 70;

const CARDIO_MET: Record<string, number> = {
  "跑步": 9.8,
  "骑行": 7.5,
  "快走": 4.3,
  "爬坡走": 6.0,
  "跳绳": 11.8,
  "游泳": 8.0,
  "椭圆机": 5.0,
  "划船机": 7.0,
  "爬楼梯机": 8.8,
  "动感单车": 8.5,
  "HIIT": 10.2,
};

const STRENGTH_MUSCLE_FACTOR: Record<string, number> = {
  "胸": 0.09,
  "背": 0.095,
  "肩": 0.08,
  "腿": 0.11,
  "手臂": 0.075,
};

const STRENGTH_EXERCISE_BOOST: Record<string, number> = {
  "深蹲": 0.02,
  "硬拉": 0.022,
  "腿举": 0.02,
  "臀推": 0.018,
  "前蹲": 0.018,
  "平板卧推": 0.014,
  "上斜卧推": 0.014,
  "下斜卧推": 0.014,
  "杠铃划船": 0.014,
  "杠铃推举": 0.012,
};

const INTENSITY_MULTIPLIER: Record<NonNullable<WorkoutSet["intensity"]>, number> = {
  easy: 0.86,
  medium: 1,
  hard: 1.18,
};

const normalizeMuscle = (muscle: string) => (muscle.includes("有氧") ? "有氧" : muscle);

const estimateStrengthCalories = (muscle: string, exercise: string, weight: number, reps: number) => {
  const base = STRENGTH_MUSCLE_FACTOR[normalizeMuscle(muscle)] ?? 0.085;
  const boost = STRENGTH_EXERCISE_BOOST[exercise] ?? 0;
  return Math.max(0, weight) * Math.max(0, reps) * (base + boost);
};

const estimateCardioCalories = (
  exercise: string,
  duration: number,
  intensity?: WorkoutSet["intensity"],
  bodyWeightKg = DEFAULT_BODY_WEIGHT_KG
) => {
  const met = CARDIO_MET[exercise] ?? 6;
  const multiplier = intensity ? INTENSITY_MULTIPLIER[intensity] : 1;
  return (met * Math.max(1, bodyWeightKg) * Math.max(0, duration) / 60) * multiplier;
};

export const estimateSetCalories = (params: { muscle: string; exercise: string; set: WorkoutSet; bodyWeightKg?: number }) => {
  const { muscle, exercise, set, bodyWeightKg } = params;
  if (typeof set.calories === "number" && Number.isFinite(set.calories)) {
    return Math.max(0, set.calories);
  }
  if (muscle.includes("有氧")) {
    const duration = set.duration ?? set.weight ?? 0;
    return estimateCardioCalories(exercise, duration, set.intensity, bodyWeightKg);
  }
  return estimateStrengthCalories(muscle, exercise, set.weight ?? 0, set.reps ?? 0);
};

export const estimateWorkoutCalories = (
  workout: { muscle: string; exercise: string; sets: WorkoutSet[] },
  bodyWeightKg?: number
) => {
  return workout.sets.reduce((sum, set) => sum + estimateSetCalories({
    muscle: workout.muscle,
    exercise: workout.exercise,
    set,
    bodyWeightKg,
  }), 0);
};

