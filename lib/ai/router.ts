// ============================================================
//  lib/ai/router.ts v4 — 支持五个 provider
//  ollama / deepseek / openai / claude / gemini / qwen
// ============================================================

import { callOllama }   from "./providers/ollama";
import { callDeepSeek } from "./providers/deepseek";
import { callOpenAI }   from "./providers/openai";
import { callClaude }   from "./providers/claude";
import { callGemini }   from "./providers/gemini";
import { callQwen }     from "./providers/qwen";
import {
  nutritionPrompt,
  workoutPrompt,
  fastingPrompt,
  shoppingPrompt,
  motivationPrompt,
  hydrationSleepPrompt,
  lifestylePrompt,
} from "./modules/prompts";
import { extractJson } from "./utils/extractJson";
import type { UserProfile } from "../types/health";

type ModuleKey =
  | "nutrition"
  | "workout"
  | "fasting"
  | "shopping"
  | "motivation"
  | "hydrationSleep"
  | "lifestyle";

async function callProvider(prompt: string, profile: UserProfile): Promise<string> {
  const key = profile.openaiApiKey ?? "";

  switch (profile.provider) {
    case "deepseek":
      if (!key) throw new Error("请填写 DeepSeek API Key");
      return callDeepSeek(prompt, key);

    case "openai":
      if (!key) throw new Error("请填写 OpenAI API Key");
      return callOpenAI(prompt, key);

    case "claude":
      if (!key) throw new Error("请填写 Claude API Key");
      return callClaude(prompt, key);

    case "gemini":
      if (!key) throw new Error("请填写 Gemini API Key");
      return callGemini(prompt, key);

    case "qwen":
      if (!key) throw new Error("请填写通义千问 API Key");
      return callQwen(prompt, key);

    case "ollama":
    default:
      return callOllama(prompt, profile.modelName as any);
  }
}

async function runModule(
  key: ModuleKey,
  prompt: string,
  profile: UserProfile
): Promise<[ModuleKey, unknown]> {
  try {
    const raw = await callProvider(prompt, profile);
    const data = extractJson(raw);
    return [key, data];
  } catch (e) {
    console.error(`[router] Module "${key}" failed:`, e);
    return [key, { error: e instanceof Error ? e.message : "未知错误" }];
  }
}

export async function generateAllModules(profile: UserProfile) {
  const tasks: [ModuleKey, string][] = [
    ["nutrition",      nutritionPrompt(profile)],
    ["workout",        workoutPrompt(profile)],
    ["fasting",        fastingPrompt(profile)],
    ["shopping",       shoppingPrompt(profile)],
    ["motivation",     motivationPrompt(profile)],
    ["hydrationSleep", hydrationSleepPrompt(profile)],
    ["lifestyle",      lifestylePrompt(profile)],
  ];

  const results = await Promise.all(
    tasks.map(([key, prompt]) => runModule(key, prompt, profile))
  );

  return Object.fromEntries(results);
}
