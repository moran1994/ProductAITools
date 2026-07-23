import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    product: "产品经理AI空间站",
    ok: true,
    llm: Boolean(process.env.LLM_API_KEY),
  });
}
