// ============================================================
// lib/ai/utils/extractJson.ts
// LLM 产品保命文件 — 从 LLM 乱输出中安全提取 JSON
// ============================================================

/**
 * 从 LLM 原始输出中提取并解析 JSON。
 * 处理以下常见 LLM 问题：
 * - 带 ```json ... ``` 代码块
 * - 带前缀解释文字（"当然，这是你的计划："）
 * - 尾部多余文字
 * - 单引号替代双引号
 * - 键名没有引号
 * - 结尾缺少括号
 */
export function extractJson<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw) return null;

  let text = raw.trim();

  // 1. 剥离 markdown 代码块
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 2. 找第一个 { 或 [ 的位置（跳过前缀说明文字）
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");

  let startIndex = -1;
  if (firstBrace === -1 && firstBracket === -1) return null;
  if (firstBrace === -1) startIndex = firstBracket;
  else if (firstBracket === -1) startIndex = firstBrace;
  else startIndex = Math.min(firstBrace, firstBracket);

  text = text.slice(startIndex);

  // 3. 找最后一个 } 或 ]（截掉尾部垃圾）
  const lastBrace = text.lastIndexOf("}");
  const lastBracket = text.lastIndexOf("]");
  const endIndex = Math.max(lastBrace, lastBracket);

  if (endIndex === -1) return null;
  text = text.slice(0, endIndex + 1);

  // 4. 尝试直接 parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // 继续修复
  }

  // 5. 修复单引号（'key': 'value' → "key": "value"）
  // 注意：只替换作为 JSON 结构符的单引号，不破坏内容中的撇号
  const singleFixed = text.replace(/'/g, '"');
  try {
    return JSON.parse(singleFixed) as T;
  } catch {
    // 继续
  }

  // 6. 修复尾部缺少括号
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;

  let padded = text;
  for (let i = 0; i < openBrackets - closeBrackets; i++) padded += "]";
  for (let i = 0; i < openBraces - closeBraces; i++) padded += "}";

  try {
    return JSON.parse(padded) as T;
  } catch {
    // 继续
  }

  // 7. 最后手段：移除尾部逗号（JSON 不允许 trailing comma）
  const noTrailing = padded
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");

  try {
    return JSON.parse(noTrailing) as T;
  } catch {
    console.error("[extractJson] All parsing strategies failed.\nRaw text:", raw.slice(0, 300));
    return null;
  }
}
