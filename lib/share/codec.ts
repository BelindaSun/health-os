// ============================================================
// lib/share/codec.ts  v2
// 方案 JSON → lz-string 压缩 → URL-safe base64
// 体积比旧版减少约 60-70%，微信等平台不再截断
// 向后兼容：旧链接（无 "lz:" 前缀）照样能解码
// ============================================================

import LZString from "lz-string";
import { HealthPlan } from "@/lib/types/health";

// 只分享展示需要的字段，不带 status/id 等元信息
type SharePayload = {
  profile: Pick<HealthPlan["profile"], "age" | "weight" | "height" | "goal" | "gender">;
  nutrition: HealthPlan["nutrition"];
  workout: HealthPlan["workout"];
  fasting: HealthPlan["fasting"];
  shopping: HealthPlan["shopping"];
  motivation: HealthPlan["motivation"];
  hydrationSleep: HealthPlan["hydrationSleep"];
  lifestyle: HealthPlan["lifestyle"];
  createdAt: string;
};

// 新格式标记前缀，用于在 decodePlan 里区分新旧链接
const NEW_FORMAT_PREFIX = "lz:";

/**
 * 把方案编码进 URL-safe 字符串（lz-string 压缩）
 */
export function encodePlan(plan: HealthPlan): string {
  const payload: SharePayload = {
    profile: {
      age: plan.profile.age,
      weight: plan.profile.weight,
      height: plan.profile.height,
      goal: plan.profile.goal,
      gender: plan.profile.gender,
    },
    nutrition: plan.nutrition,
    workout: plan.workout,
    fasting: plan.fasting,
    shopping: plan.shopping,
    motivation: plan.motivation,
    hydrationSleep: plan.hydrationSleep,
    lifestyle: plan.lifestyle,
    createdAt: plan.createdAt,
  };

  const json = JSON.stringify(payload);

  // lz-string 直接输出 URL-safe base64，不需要再做替换
  const compressed = LZString.compressToEncodedURIComponent(json);

  // 加前缀，让 decodePlan 知道这是新格式
  return NEW_FORMAT_PREFIX + compressed;
}

/**
 * 从 URL 字符串解码方案
 * 自动识别新格式（lz: 前缀）和旧格式（纯 base64）
 * 返回 null 表示链接损坏或格式不对
 */
export function decodePlan(encoded: string): SharePayload | null {
  try {
    // ── 新格式：lz-string 压缩 ──
    if (encoded.startsWith(NEW_FORMAT_PREFIX)) {
      const compressed = encoded.slice(NEW_FORMAT_PREFIX.length);
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (!json) return null;
      return JSON.parse(json) as SharePayload;
    }

    // ── 旧格式：纯 base64（向后兼容，旧链接照样能打开）──
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(atob(padded));
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

/**
 * 生成完整的分享 URL
 */
export function generateShareUrl(plan: HealthPlan, origin: string): string {
  const encoded = encodePlan(plan);
  return `${origin}/share?p=${encoded}`;
}
