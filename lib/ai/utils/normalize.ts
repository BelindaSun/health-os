// ============================================================
// lib/ai/utils/normalize.ts
// 统一 LLM 输出的数据结构 — 防止前端天天炸
// ============================================================

/**
 * 把任意值统一为数组。
 * LLM 经常把本该是数组的字段输出成：
 *   - 单个字符串  → ["字符串"]
 *   - 对象        → Object.values(obj)
 *   - null/undefined → []
 */
export function toArray<T = unknown>(value: unknown): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "object") return Object.values(value) as T[];
  return [value] as T[];
}

/**
 * 把任意值统一为字符串。
 * 处理 LLM 把字符串字段输出为数组/对象的情况。
 */
export function toString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (Array.isArray(value)) return value.join("、") || fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value) || fallback;
}

/**
 * 把任意值统一为数字。
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

/**
 * 安全读取嵌套字段，避免 undefined 炸链。
 * 用法：safeGet(obj, "nutrition.days.0.breakfast", "暂无")
 */
export function safeGet<T = unknown>(
  obj: unknown,
  path: string,
  fallback: T
): T {
  try {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return fallback;
      current = (current as Record<string, unknown>)[part];
    }
    return (current ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/**
 * 升级版 normalizeSection（兼容现有 page.tsx 里的同名函数）
 * 直接可替换现有代码。
 */
export function normalizeSection(section: unknown): unknown[] {
  return toArray(section);
}
