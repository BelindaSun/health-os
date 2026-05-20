// ============================================================
//  app/api/generate/route.ts v2
//  接收完整 UserProfile，并行调用7个模块
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { generateAllModules } from "@/lib/ai/router";
import type { UserProfile } from "@/lib/types/health";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[generate] received body keys:", Object.keys(body));
    const { profile } = body as { profile: UserProfile };
    console.log("[generate] profile.age:", profile?.age, "profile.gender:", profile?.gender);

    if (!profile || !profile.age) {
      console.error("[generate] validation failed — profile:", JSON.stringify(profile));
      return NextResponse.json({ error: "缺少用户画像" }, { status: 400 });
    }

    const results = await generateAllModules(profile);
    return NextResponse.json(results);
  } catch (e) {
    console.error("[generate] Error:", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
