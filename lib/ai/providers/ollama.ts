// ============================================================
// lib/ai/providers/ollama.ts
// Ollama provider（OpenAI 兼容接口）
// 升级自现有 ollama.ts，保留原有逻辑，增加灵活配置
// ============================================================

export interface OllamaConfig {
  baseURL?: string;  // default: http://localhost:11434/v1
  model?: string;    // default: qwen2.5:3b
  temperature?: number;
}

export async function callOllama(
  prompt: string,
  config: OllamaConfig = {}
): Promise<string> {
  const {
    baseURL = "http://localhost:11434/v1",
    model = "qwen2.5:3b",
    temperature = 0.7,
  } = config;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) throw new Error("Ollama returned empty content");
  return content;
}
