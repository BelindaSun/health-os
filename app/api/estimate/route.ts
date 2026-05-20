// app/api/generate/estimate/route.ts
// 单次食物热量估算，供 DailyFoodTracker 使用

import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/ai/utils/extractJson";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "no prompt" }, { status: 400 });

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        prompt,
        stream: false,
        options: { temperature: 0.1 },
      }),
    });

    const raw = await ollamaRes.json();
    const text = raw.response ?? "";
    const data = extractJson(text);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ calories: 0, protein: 0 }, { status: 200 });
  }
}
