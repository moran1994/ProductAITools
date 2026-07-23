import { NextRequest, NextResponse } from "next/server";
import { callLLM, type RunNodeRequest } from "@/lib/llm";
import { resolveSkill } from "@/lib/types";
import skillBodies from "@/data/skill-bodies.json";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RunNodeRequest;
    if (!body?.flowId || !body?.nodeId || !body?.node) {
      return NextResponse.json({ error: "缺少 flowId / nodeId / node" }, { status: 400 });
    }

    const skill = resolveSkill(body.node, body.vars || {});
    const skillId = Array.isArray(skill) ? skill[0] : skill;
    const bodies = skillBodies as Record<string, string>;
    let skillBody = skillId ? bodies[skillId] : undefined;
    if (Array.isArray(skill)) {
      skillBody = skill.map((id) => `## ${id}\n${bodies[id] || ""}`).join("\n\n");
    }

    const content = await callLLM(body, skillBody);
    return NextResponse.json({
      ok: true,
      content,
      resolved_skill: skill,
      model: process.env.LLM_MODEL || "gpt-4o-mini",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const configured = Boolean(process.env.LLM_API_KEY);
  return NextResponse.json({
    configured,
    baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
  });
}
