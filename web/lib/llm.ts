import type { FlowNode } from "./types";
import { resolveSkill } from "./types";

export type RunNodeRequest = {
  flowId: string;
  flowName: string;
  nodeId: string;
  node: FlowNode;
  vars: Record<string, string>;
  topic?: string;
  userMessage?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

function buildSystemPrompt(req: RunNodeRequest, skillBody?: string): string {
  const skill = resolveSkill(req.node, req.vars);
  const skillLabel = Array.isArray(skill) ? skill.join(", ") : skill || "(none)";

  return `你是「产品经理AI空间站」的执行引擎。按节点类型完成当前步骤，输出结构清晰的中文结果。

流程：${req.flowName} (${req.flowId})
节点：${req.nodeId} — ${req.node.title || req.node.type}
类型：${req.node.type}
关联 skill：${skillLabel}
变量：${JSON.stringify(req.vars)}
主题：${req.topic || "（未指定）"}

规则：
- type=gate：根据 ask 列表向用户澄清，或在已有信息足够时总结上下文并给出可进入下一步的结论。
- type=skill：严格遵循下方 skill 说明执行，给出可交付产出。
- type=choice/router：列出选项并给出推荐，等待用户选择。
- type=compose：汇总前序产出，生成文档草稿。
- type=sequence：按步骤技能依次给出简要产出。
- 若有 checkpoint，结尾用「【检查点】」列出需用户确认的问题。
- 不要编造无法核实的数据；假设处请标注。

${skillBody ? `--- SKILL 说明 ---\n${skillBody}\n--- END ---` : ""}`;
}

export async function callLLM(req: RunNodeRequest, skillBody?: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("未配置 LLM_API_KEY。请在 web/.env.local 中设置（见 .env.example）。");
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: buildSystemPrompt(req, skillBody) },
    ...(req.history || []).map((h) => ({ role: h.role, content: h.content })),
    {
      role: "user",
      content:
        req.userMessage ||
        (req.node.ask?.length
          ? `请处理本节点。已知信息：${JSON.stringify(req.vars)}。待澄清：${req.node.ask.join(" / ")}`
          : `请执行节点「${req.node.title || req.nodeId}」。`),
    },
  ];

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM 请求失败 ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 返回空内容");
  return content;
}
