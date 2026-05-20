// lib/ai/providers/claude.ts
// Anthropic Claude API 调用封装

export async function callClaude(
  prompt: string,
  apiKey: string,
  model = "claude-sonnet-4-5"
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system:
        "你是一个健康管理AI助手。严格按照用户要求的JSON格式输出，不要输出任何其他内容，不要加markdown代码块。",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}
